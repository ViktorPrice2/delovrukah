import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { ProviderCatalogCategoryDto } from './dto/provider-catalog.dto';
import { ProviderPriceDto } from './dto/provider-price.dto';
import { ProviderProfileDto } from './dto/provider-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProviderPricesDto } from './dto/update-prices.dto';

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);

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

    const providerProfile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { city: true },
    });

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

    const providerProfile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { city: true },
    });

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

    const providerProfile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { city: true },
    });

    if (!providerProfile) {
      throw new NotFoundException('Provider profile not found');
    }

    const data: (Prisma.ProviderProfileUpdateInput & {
      hourlyRate?: Prisma.Decimal | null;
    }) = {};

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
      data.hourlyRate =
        dto.hourlyRate === null ? null : new Prisma.Decimal(dto.hourlyRate);
    }

    if (Object.keys(data).length === 0) {
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

    const updatedProfile = await this.prisma.providerProfile.update({
      where: { id: providerProfile.id },
      data,
      include: { city: true },
    });

    return {
      id: updatedProfile.id,
      displayName: updatedProfile.displayName,
      description: updatedProfile.description ?? null,
      cityId: updatedProfile.cityId ?? null,
      cityName: updatedProfile.city?.name ?? null,
      hourlyRate: this.normalizeHourlyRate(updatedProfile),
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt,
    };
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

    const providerProfile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

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

    const providerProfile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { city: true },
    });

    if (!providerProfile) {
      throw new NotFoundException('Provider profile not found');
    }

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
}
