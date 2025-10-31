import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderCatalogCategoryDto } from './dto/provider-catalog.dto';
import { ProviderPriceDto } from './dto/provider-price.dto';
import { ProviderProfileDto } from './dto/provider-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProviderPricesDto } from './dto/update-prices.dto';

@Injectable()
export class ProviderService {
  constructor(private readonly prisma: PrismaService) {}

  async getProviderPrices(userId: string): Promise<ProviderPriceDto[]> {
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
    const providerProfile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { city: true },
    });

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

    if (Object.keys(data).length === 0) {
      return {
        id: providerProfile.id,
        displayName: providerProfile.displayName,
        description: providerProfile.description ?? null,
        cityId: providerProfile.cityId ?? null,
        cityName: providerProfile.city?.name ?? null,
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
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt,
    };
  }

  async upsertPrices(
    userId: string,
    dto: UpdateProviderPricesDto,
  ): Promise<ProviderPriceDto[]> {
    const providerProfile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!providerProfile) {
      throw new NotFoundException('Provider profile not found');
    }

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

    return updates;
  }

  async getProfile(userId: string): Promise<ProviderProfileDto> {
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
      createdAt: providerProfile.createdAt,
      updatedAt: providerProfile.updatedAt,
    };
  }
}
