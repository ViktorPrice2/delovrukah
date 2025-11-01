import { Category } from '@prisma/client';

export class AdminCategoryDto {
  id!: string;
  name!: string;
  slug!: string;
  description!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(category: Category): AdminCategoryDto {
    const dto = new AdminCategoryDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.slug = category.slug;
    dto.description = category.description ?? null;
    dto.createdAt = category.createdAt;
    dto.updatedAt = category.updatedAt;
    return dto;
  }
}
