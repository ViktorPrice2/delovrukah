import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Category,
  City,
  Prisma,
  ProviderProfile,
  ServiceTemplate,
  ServiceTemplateVersion,
} from '@prisma/client';
import { CityDto } from '../geo/dto/city.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryDto } from './dto/category.dto';
import {
  ServiceDetailDto,
  ServiceProviderDto,
  ServiceSummaryDto,
  ServiceVersionDto,
} from './dto/service.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories(): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return categories.map((category) => this.mapCategory(category));
  }

  async getServicesByCategory(
    categoryId: string,
  ): Promise<ServiceSummaryDto[]> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    const services = await this.prisma.serviceTemplate.findMany({
      where: { categoryId },
      orderBy: { name: 'asc' },
      include: {
        versions: {
          where: { isActive: true },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    return services.map((service) => this.mapServiceSummary(service));
  }

  async getServiceById(
    serviceId: string,
    citySlug?: string,
  ): Promise<ServiceDetailDto> {
    const service = await this.prisma.serviceTemplate.findUnique({
      where: { id: serviceId },
      include: {
        category: true,
        versions: {
          where: { isActive: true },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Услуга не найдена');
    }

    const summary = this.mapServiceSummary(service);
    const latestVersion = service.versions.at(0) ?? null;

    let providers: ServiceProviderDto[] | undefined;

    if (citySlug) {
      const city = await this.prisma.city.findUnique({
        where: { slug: citySlug },
      });

      if (!city || !latestVersion) {
        providers = [];
      } else {
        const prices = await this.prisma.price.findMany({
          where: {
            serviceTemplateVersionId: latestVersion.id,
            providerProfile: { cityId: city.id },
          },
          include: {
            providerProfile: {
              include: { city: true },
            },
          },
          orderBy: { price: 'asc' },
        });

        providers = prices
          .map((price) => {
            if (!price.providerProfile.city) {
              return null;
            }

            return this.mapServiceProvider(
              price.providerProfile as ProviderProfile & { city: City },
              price.price,
            );
          })
          .filter((provider): provider is ServiceProviderDto => provider !== null);
      }
    }

    return {
      ...summary,
      authorId: service.authorId,
      keeperId: service.keeperId,
      category: this.mapCategory(service.category),
      providers,
    };
  }

  private mapCategory(category: Category): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
    };
  }

  private mapServiceSummary(
    service: ServiceTemplate & { versions: ServiceTemplateVersion[] },
  ): ServiceSummaryDto {
    const latestVersion = service.versions.at(0) ?? null;

    return {
      id: service.id,
      categoryId: service.categoryId,
      name: service.name,
      description: service.description,
      latestVersion: this.mapVersion(latestVersion),
    };
  }

  private mapVersion(
    version: ServiceTemplateVersion | null,
  ): ServiceVersionDto | null {
    if (!version) {
      return null;
    }

    return {
      id: version.id,
      versionNumber: version.versionNumber,
      title: version.title,
      description: version.description,
      isActive: version.isActive,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    };
  }

  private mapServiceProvider(
    provider: ProviderProfile & { city: City },
    price: Prisma.Decimal,
  ): ServiceProviderDto {
    return {
      id: provider.id,
      displayName: provider.displayName,
      description: provider.description ?? null,
      price: price.toNumber(),
      city: this.mapCity(provider.city),
    };
  }

  private mapCity(city: City): CityDto {
    return {
      id: city.id,
      name: city.name,
      slug: city.slug,
    };
  }
}
