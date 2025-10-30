import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'; // <-- Добавляем NotFoundException
import { CatalogService } from './catalog.service';
import { CategoryDto } from './dto/category.dto';
import { ServiceDetailDto, ServiceSummaryDto } from './dto/service.dto';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  getCategories(): Promise<CategoryDto[]> {
    return this.catalogService.getCategories();
  }

  @Get('categories/:id/services')
  getServicesByCategory(
    @Param('id') categoryId: string,
  ): Promise<ServiceSummaryDto[]> {
    return this.catalogService.getServicesByCategory(categoryId);
  }

  @Get('services')
  async findServices(
    @Query('citySlug') citySlug: string,
    @Query('categorySlug') categorySlug: string,
  ): Promise<ServiceDetailDto[]> {
    return this.catalogService.getServicesByCategorySlug(citySlug, categorySlug);
  }

  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  @Get('services/:slugOrId')
  async findOne(
    @Param('slugOrId') slugOrId: string,
    @Query('citySlug') citySlug?: string,
  ): Promise<ServiceDetailDto> { // <-- Тип Promise<ServiceDetailDto> оставляем, это правильно для успешного ответа
    const service = await this.catalogService.getServiceBySlugOrId(slugOrId, citySlug);

    // Если сервис вернул null, выбрасываем стандартную ошибку NestJS
    if (!service) {
      throw new NotFoundException('Услуга не найдена');
    }

    // Если все хорошо, возвращаем найденную услугу
    return service;
  }
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}