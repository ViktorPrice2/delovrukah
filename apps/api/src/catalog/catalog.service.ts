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

  // Этот метод остается для обратной совместимости или внутреннего использования
  async getServicesByCategory(
    categoryId: string,
  ): Promise<ServiceSummaryDto[]> {
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
  }
  // --- КОНЕЦ НОВОГО МЕТОДА ---

  async getServiceBySlugOrId(
    slugOrId: string,
    citySlug?: string,
  ): Promise<ServiceDetailDto | null> {
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
      return null;
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
