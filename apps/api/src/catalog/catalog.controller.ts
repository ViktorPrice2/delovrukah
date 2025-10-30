import { Controller, Get, Param, Query } from '@nestjs/common';
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

  @Get('services/:id')
  getService(
    @Param('id') serviceId: string,
    @Query('citySlug') citySlug?: string,
  ): Promise<ServiceDetailDto> {
    return this.catalogService.getServiceById(serviceId, citySlug);
  }
}
