import {
  Category,
  ServiceTemplate,
  ServiceTemplateVersion,
} from '@prisma/client';

export class AdminServiceVersionDto {
  id!: string;
  serviceTemplateId!: string;
  versionNumber!: number;
  title!: string;
  description!: string;
  whatsIncluded!: unknown;
  whatsNotIncluded!: unknown;
  unitOfMeasure!: string;
  requiredTools!: unknown;
  customerRequirements!: unknown;
  media!: unknown;
  estimatedTime!: string | null;
  maxTimeIncluded!: number | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(version: ServiceTemplateVersion): AdminServiceVersionDto {
    const dto = new AdminServiceVersionDto();
    dto.id = version.id;
    dto.serviceTemplateId = version.serviceTemplateId;
    dto.versionNumber = version.versionNumber;
    dto.title = version.title;
    dto.description = version.description;
    dto.whatsIncluded = version.whatsIncluded;
    dto.whatsNotIncluded = version.whatsNotIncluded;
    dto.unitOfMeasure = version.unitOfMeasure;
    dto.requiredTools = version.requiredTools;
    dto.customerRequirements = version.customerRequirements;
    dto.media = version.media;
    dto.estimatedTime = version.estimatedTime ?? null;
    dto.maxTimeIncluded = version.maxTimeIncluded ?? null;
    dto.isActive = version.isActive;
    dto.createdAt = version.createdAt;
    dto.updatedAt = version.updatedAt;
    return dto;
  }
}

export class AdminServiceTemplateDto {
  id!: string;
  categoryId!: string;
  categoryName!: string;
  name!: string;
  slug!: string;
  description!: string | null;
  medianPrice!: number | null;
  authorId!: string | null;
  keeperId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  versions!: AdminServiceVersionDto[];
  latestVersion!: AdminServiceVersionDto | null;

  static fromEntity(
    template: ServiceTemplate & {
      versions: ServiceTemplateVersion[];
      category: Category;
    },
  ): AdminServiceTemplateDto {
    const dto = new AdminServiceTemplateDto();
    dto.id = template.id;
    dto.categoryId = template.categoryId;
    dto.categoryName = template.category.name;
    dto.name = template.name;
    dto.slug = template.slug;
    dto.description = template.description ?? null;
    dto.medianPrice = template.medianPrice
      ? Number(template.medianPrice)
      : null;
    dto.authorId = template.authorId ?? null;
    dto.keeperId = template.keeperId ?? null;
    dto.createdAt = template.createdAt;
    dto.updatedAt = template.updatedAt;

    const versions = [...template.versions].sort(
      (a, b) => b.versionNumber - a.versionNumber,
    );
    dto.versions = versions.map((version) =>
      AdminServiceVersionDto.fromEntity(version),
    );
    dto.latestVersion = dto.versions.at(0) ?? null;
    return dto;
  }
}
