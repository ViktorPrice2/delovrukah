import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { ProviderCatalogCategoryDto } from './dto/provider-catalog.dto';
import { ProviderPriceDto } from './dto/provider-price.dto';
import { ProviderProfileDto } from './dto/provider-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProviderPricesDto } from './dto/update-prices.dto';

type ProviderProfileRecord = {
  id: string;
  displayName: string;
  description: string | null;
  cityId: string | null;
  city: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
  hourlyRate?: Prisma.Decimal | number | null;
};

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private hourlyRateColumnAvailable?: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: CatalogService,
  ) {}

  async getProviderPrices(userId: string): Promise<ProviderPriceDto[]> {
    if (!this.prisma.isDatabaseAvailable) {
      this.logger.warn(
        'Database is unavailable. Unable to load provider prices. Returning empty result.',
      );
      return [];
    }

    const { profile: providerProfile } =
      await this.findProviderProfileByUserId(userId);

    if (!providerProfile) {
      throw new NotFoundException('Provider profile not found');
    }

    const prices = await this.prisma.price.findMany({
      where: { providerProfileId: providerProfile.id },
      orderBy: { createdAt: 'desc' },
    });

    return prices.map((price) => ({
      id: price.id,
      serviceTemplateVersionId: price.serviceTemplateVersionId,
      price: price.price.toNumber(),
      createdAt: price.createdAt,
      updatedAt: price.updatedAt,
    }));
  }

  async getProviderCatalog(
    userId: string,
  ): Promise<ProviderCatalogCategoryDto[]> {
    if (!this.prisma.isDatabaseAvailable) {
      this.logger.warn(
        'Database is unavailable. Provider catalog cannot be loaded. Returning empty catalog.',
      );
      return [];
    }

    const { profile: providerProfile } =
      await this.findProviderProfileByUserId(userId);

    if (!providerProfile) {
      throw new NotFoundException('Provider profile not found');
    }

    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        serviceTemplates: {
          orderBy: { name: 'asc' },
          include: {
            versions: {
              where: { isActive: true },
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const prices = await this.prisma.price.findMany({
      where: { providerProfileId: providerProfile.id },
    });

    const priceMap = new Map<string, number>(
      prices.map(
        (price) =>
          [price.serviceTemplateVersionId, price.price.toNumber()] as const,
      ),
    );

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      services: category.serviceTemplates.map((service) => {
        const latestVersion = service.versions.at(0) ?? null;
        const mappedVersion = latestVersion
          ? {
              id: latestVersion.id,
              versionNumber: latestVersion.versionNumber,
              title: latestVersion.title,
              description: latestVersion.description ?? null,
              isActive: latestVersion.isActive,
              createdAt: latestVersion.createdAt,
              updatedAt: latestVersion.updatedAt,
              ...(priceMap.has(latestVersion.id)
                ? { providerPrice: priceMap.get(latestVersion.id) }
                : {}),
            }
          : null;

        return {
          id: service.id,
          name: service.name,
          slug: service.slug,
          description: service.description ?? null,
          latestVersion: mappedVersion,
        };
      }),
    }));
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProviderProfileDto> {
    if (!this.prisma.isDatabaseAvailable) {
      this.logger.warn(
        'Database is unavailable. Provider profile update cannot be processed.',
      );
      throw new NotFoundException('Provider profile not found');
    }

    const { profile: providerProfile, hourlyRateAvailable } =
      await this.findProviderProfileByUserId(userId);

    if (!providerProfile) {
      throw new NotFoundException('Provider profile not found');
    }

    const data: Prisma.ProviderProfileUpdateInput = {};

    if (dto.displayName !== undefined) {
      data.displayName = dto.displayName;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.cityId !== undefined) {
      data.city = dto.cityId
        ? { connect: { id: dto.cityId } }
        : { disconnect: true };
    }

    if (dto.hourlyRate !== undefined) {
      if (hourlyRateAvailable) {
        data.hourlyRate =
          dto.hourlyRate === null ? null : new Prisma.Decimal(dto.hourlyRate);
      } else {
        this.logger.warn(
          'Attempted to update provider hourly rate, but the column is missing. Skipping hourly rate update.',
        );
      }
    }

    if (Object.keys(data).length === 0) {
      return this.mapProviderProfileToDto(providerProfile);
    }

    const updatedProfile = (await this.prisma.providerProfile.update({
      where: { id: providerProfile.id },
      data,
      select: this.getProviderProfileSelect(hourlyRateAvailable),
    })) as ProviderProfileRecord;

    return this.mapProviderProfileToDto(updatedProfile);
  }

  async upsertPrices(
    userId: string,
    dto: UpdateProviderPricesDto,
  ): Promise<ProviderPriceDto[]> {
    if (!this.prisma.isDatabaseAvailable) {
      this.logger.warn(
        'Database is unavailable. Provider prices cannot be updated.',
      );
      throw new NotFoundException('Provider profile not found');
    }

    const { profile: providerProfile } =
      await this.findProviderProfileByUserId(userId);

    if (!providerProfile) {
      throw new NotFoundException('Provider profile not found');
    }

    const serviceTemplateVersionIds = Array.from(
      new Set(dto.prices.map((price) => price.serviceTemplateVersionId)),
    );

    const updates = await this.prisma.$transaction(async (tx) => {
      const results: ProviderPriceDto[] = [];

      for (const priceUpdate of dto.prices) {
        const { serviceTemplateVersionId, price } = priceUpdate;

        if (price === null || price === undefined) {
          await tx.price.deleteMany({
            where: {
              providerProfileId: providerProfile.id,
              serviceTemplateVersionId,
            },
          });
          continue;
        }

        const decimalPrice = new Prisma.Decimal(price);

        const upsertedPrice = await tx.price.upsert({
          where: {
            providerProfileId_serviceTemplateVersionId: {
              providerProfileId: providerProfile.id,
              serviceTemplateVersionId,
            },
          },
          update: { price: decimalPrice },
          create: {
            providerProfileId: providerProfile.id,
            serviceTemplateVersionId,
            price: decimalPrice,
          },
        });

        results.push({
          id: upsertedPrice.id,
          serviceTemplateVersionId: upsertedPrice.serviceTemplateVersionId,
          price: upsertedPrice.price.toNumber(),
          createdAt: upsertedPrice.createdAt,
          updatedAt: upsertedPrice.updatedAt,
        });
      }

      return results;
    });

    if (serviceTemplateVersionIds.length > 0) {
      const relatedServiceTemplates =
        await this.prisma.serviceTemplateVersion.findMany({
          where: { id: { in: serviceTemplateVersionIds } },
          select: { serviceTemplateId: true },
        });

      const uniqueTemplateIds = new Set(
        relatedServiceTemplates.map((version) => version.serviceTemplateId),
      );

      await Promise.all(
        Array.from(uniqueTemplateIds).map((serviceTemplateId) =>
          this.catalogService.updateMedianPrice(serviceTemplateId),
        ),
      );
    }

    return updates;
  }

  async getProfile(userId: string): Promise<ProviderProfileDto> {
    if (!this.prisma.isDatabaseAvailable) {
      this.logger.warn(
        'Database is unavailable. Returning provider profile as not found.',
      );
      throw new NotFoundException('Provider profile not found');
    }

    const { profile: providerProfile } =
      await this.findProviderProfileByUserId(userId);

    if (!providerProfile) {
      throw new NotFoundException('Provider profile not found');
    }

    return this.mapProviderProfileToDto(providerProfile);
  }

  private normalizeHourlyRate(provider: unknown): number | null {
    if (!provider || typeof provider !== 'object') {
      return null;
    }

    const { hourlyRate } = provider as {
      hourlyRate?: Prisma.Decimal | number | null;
    };

    if (hourlyRate === undefined || hourlyRate === null) {
      return null;
    }

    if (typeof hourlyRate === 'number') {
      return hourlyRate;
    }

    return hourlyRate.toNumber();
  }

  private async findProviderProfileByUserId(userId: string): Promise<{
    profile: ProviderProfileRecord | null;
    hourlyRateAvailable: boolean;
  }> {
    const hourlyRateAvailable = await this.isHourlyRateColumnAvailable();
    const profile = (await this.prisma.providerProfile.findUnique({
      where: { userId },
      select: this.getProviderProfileSelect(hourlyRateAvailable),
    })) as ProviderProfileRecord | null;

    return { profile, hourlyRateAvailable };
  }

  private getProviderProfileSelect(
    includeHourlyRate: boolean,
  ): Prisma.ProviderProfileSelect {
    const baseSelect: Prisma.ProviderProfileSelect = {
      id: true,
      displayName: true,
      description: true,
      cityId: true,
      createdAt: true,
      updatedAt: true,
      city: {
        select: {
          id: true,
          name: true,
        },
      },
    };

    if (includeHourlyRate) {
      return {
        ...baseSelect,
        hourlyRate: true,
      };
    }

    return { ...baseSelect };
  }

  private mapProviderProfileToDto(
    providerProfile: ProviderProfileRecord,
  ): ProviderProfileDto {
    return {
      id: providerProfile.id,
      displayName: providerProfile.displayName,
      description: providerProfile.description ?? null,
      cityId: providerProfile.cityId ?? null,
      cityName: providerProfile.city?.name ?? null,
      hourlyRate: this.normalizeHourlyRate(providerProfile),
      createdAt: providerProfile.createdAt,
      updatedAt: providerProfile.updatedAt,
    };
  }

  private async isHourlyRateColumnAvailable(): Promise<boolean> {
    if (this.hourlyRateColumnAvailable !== undefined) {
      return this.hourlyRateColumnAvailable;
    }

    if (!this.prisma.isDatabaseAvailable) {
      this.hourlyRateColumnAvailable = false;
      return this.hourlyRateColumnAvailable;
    }

    try {
      const result = await this.prisma.$queryRaw<
        { exists: boolean }[]
      >(Prisma.sql`SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'ProviderProfile'
              AND column_name = 'hourlyRate'
          ) AS "exists";`);

      this.hourlyRateColumnAvailable = Boolean(result.at(0)?.exists);

      if (!this.hourlyRateColumnAvailable) {
        this.logger.warn(
          'ProviderProfile.hourlyRate column is missing. Hourly rate data will be omitted until the database migration is applied.',
        );
      }
    } catch (error) {
      this.hourlyRateColumnAvailable = false;
      this.logger.warn(
        'Unable to verify ProviderProfile.hourlyRate column existence. Assuming it is absent.',
        error instanceof Error ? error.stack : undefined,
      );
    }

    return this.hourlyRateColumnAvailable;
  }
}
