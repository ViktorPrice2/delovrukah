import { Prisma, ServiceTemplateVersion } from '@prisma/client';

export const adminServiceTemplateInclude =
  Prisma.validator<Prisma.ServiceTemplateInclude>()({
    category: true,
    versions: { orderBy: { versionNumber: 'desc' as const } },
  });

export type AdminServiceTemplateWithRelations = Prisma.ServiceTemplateGetPayload<{
  include: typeof adminServiceTemplateInclude;
}>;

export class AdminServiceVersionDto {
  id!: string;
  serviceTemplateId!: string;
  versionNumber!: number;
  title!: string;
  description!: string;
  whatsIncluded!: Prisma.JsonValue;
  whatsNotIncluded!: Prisma.JsonValue;
  unitOfMeasure!: string;
  requiredTools!: Prisma.JsonValue;
  customerRequirements!: Prisma.JsonValue;
  media!: Prisma.JsonValue;
  estimatedTime!: string;
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
    dto.estimatedTime = version.estimatedTime;
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
    template: AdminServiceTemplateWithRelations,
  ): AdminServiceTemplateDto {
    const dto = new AdminServiceTemplateDto();
    dto.id = template.id;
    dto.categoryId = template.categoryId;
    dto.categoryName = template.category.name;
    dto.name = template.name;
    dto.slug = template.slug;
    dto.description = template.description ?? null;
    dto.medianPrice =
      template.medianPrice === null
        ? null
        : template.medianPrice.toNumber();
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
