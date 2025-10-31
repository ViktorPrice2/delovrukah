import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import {
  findMockCategoryById,
  findMockServiceBySlugOrId,
  getDefaultCitySlug,
  getMockCategories,
  getMockServiceSummariesByCategoryId,
  getMockServicesByCategorySlug,
} from '../mocks/catalog.mock-data';
import { CategoryDto } from './dto/category.dto';
import {
  ServiceDetailDto,
  ServiceProviderDto,
  ServiceSummaryDto,
  ServiceVersionDto,
} from './dto/service.dto';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCategories(): Promise<CategoryDto[]> {
    if (!this.prisma.isDatabaseAvailable) {
      this.logger.warn('Database is unavailable. Serving mock categories.');
      return getMockCategories();
    }

    try {
      const categories = await this.prisma.category.findMany({
        orderBy: { name: 'asc' },
      });
      return categories.map((category) => this.mapCategory(category));
    } catch (error) {
      this.logger.error(
        'Failed to load categories from the database. Falling back to mock data.',
        error instanceof Error ? error.stack : undefined,
      );
      return getMockCategories();
    }
  }

  // Этот метод остается для обратной совместимости или внутреннего использования
  async getServicesByCategory(
    categoryId: string,
  ): Promise<ServiceSummaryDto[]> {
    if (!this.prisma.isDatabaseAvailable) {
      const category = findMockCategoryById(categoryId);
      if (!category) {
        throw new NotFoundException('Категория не найдена');
      }
      return getMockServiceSummariesByCategoryId(categoryId);
    }

    // ... (код этого метода без изменений)
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

  // --- НАЧАЛО НОВОГО МЕТОДА ---
  async getServicesByCategorySlug(
    citySlug: string,
    categorySlug: string,
  ): Promise<ServiceDetailDto[]> {
    if (!this.prisma.isDatabaseAvailable) {
      this.logger.warn(
        `Database is unavailable. Serving mock services for category "${categorySlug}" in city "${citySlug}".`,
      );
      return getMockServicesByCategorySlug(categorySlug, citySlug);
    }

    try {
      const services = await this.prisma.serviceTemplate.findMany({
        where: {
          category: {
            slug: categorySlug,
          },
        },
        orderBy: { name: 'asc' },
      });

      if (!services || services.length === 0) {
        // Возвращаем пустой массив, если услуги в категории не найдены.
        // Фронтенд обработает это и покажет notFound().
        return [];
      }

      // Для каждой найденной услуги асинхронно получаем ее детали
      // (включая провайдеров в нужном городе)
      const detailedServicesPromises = services.map((service) =>
        this.getServiceBySlugOrId(service.slug, citySlug),
      );

      const detailedServices = await Promise.all(detailedServicesPromises);

      // Отфильтровываем возможные null, если какая-то услуга вдруг не нашлась
      return detailedServices.filter((s): s is ServiceDetailDto => s !== null);
    } catch (error) {
      this.logger.error(
        `Failed to load services for category "${categorySlug}" from the database. Falling back to mock data.`,
        error instanceof Error ? error.stack : undefined,
      );
      return getMockServicesByCategorySlug(categorySlug, citySlug);
    }
  }
  // --- КОНЕЦ НОВОГО МЕТОДА ---

  async getServiceBySlugOrId(
    slugOrId: string,
    citySlug?: string,
  ): Promise<ServiceDetailDto | null> {
    const effectiveCitySlug = citySlug ?? getDefaultCitySlug();

    if (!this.prisma.isDatabaseAvailable) {
      this.logger.warn(
        `Database is unavailable. Serving mock service for identifier "${slugOrId}" in city "${effectiveCitySlug}".`,
      );
      return findMockServiceBySlugOrId(slugOrId, effectiveCitySlug);
    }

    // <-- Изменяем возвращаемый тип на Promise<ServiceDetailDto | null>
    const service = await this.prisma.serviceTemplate.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
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
      // Вместо выбрасывания ошибки, возвращаем null. Фронтенд это обработает.
      return findMockServiceBySlugOrId(slugOrId, effectiveCitySlug);
    }

    // ... (остальная часть метода `getServiceBySlugOrId` без изменений, как в вашем коде)
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
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          include: { providerProfile: { include: { city: true } } },
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
          .filter(
            (provider): provider is ServiceProviderDto => provider !== null,
          );
      }
    }
    const detailed: ServiceDetailDto = {
      ...summary,
      authorId: service.authorId,
      keeperId: service.keeperId,
      category: this.mapCategory(service.category),
      providers,
    };

    if (!providers || providers.length === 0) {
      const fallbackCity = citySlug ?? effectiveCitySlug;
      const mockService = findMockServiceBySlugOrId(service.slug, fallbackCity);
      if (mockService?.providers?.length) {
        detailed.providers = mockService.providers;
      }
    }

    return detailed;
  }

  private mapCategory(category: Category): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
    };
  }

  private mapServiceSummary(
    service: ServiceTemplate & { versions: ServiceTemplateVersion[] },
  ): ServiceSummaryDto {
    const latestVersion = service.versions.at(0) ?? null;

    return {
      id: service.id,
      slug: service.slug, // <-- ВАЖНО: Добавьте slug, если его нет в DTO
      categoryId: service.categoryId,
      name: service.name,
      description: service.description,
      latestVersion: this.mapVersion(latestVersion),
      medianPrice: service.medianPrice?.toNumber() ?? null,
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
      whatsIncluded: version.whatsIncluded,
      whatsNotIncluded: version.whatsNotIncluded,
      unitOfMeasure: version.unitOfMeasure,
      requiredTools: version.requiredTools,
      customerRequirements: version.customerRequirements,
      media: version.media,
      estimatedTime: version.estimatedTime ?? null,
      isActive: version.isActive,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    };
  }

  async updateMedianPrice(serviceTemplateId: string): Promise<void> {
    if (!this.prisma.isDatabaseAvailable) {
      return;
    }

    const activePrices = await this.prisma.price.findMany({
      where: {
        serviceTemplateVersion: {
          serviceTemplateId,
          isActive: true,
        },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { price: true },
      orderBy: { price: 'asc' },
    });

    if (activePrices.length === 0) {
      await this.prisma.serviceTemplate.update({
        where: { id: serviceTemplateId },
        data: { medianPrice: null },
      });
      return;
    }

    const sorted = activePrices.map((p) => p.price.toNumber());
    const middle = Math.floor(sorted.length / 2);

    let median: number;
    if (sorted.length % 2 === 0) {
      median = (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      median = sorted[middle];
    }

    await this.prisma.serviceTemplate.update({
      where: { id: serviceTemplateId },
      data: { medianPrice: new Prisma.Decimal(median) },
    });
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
