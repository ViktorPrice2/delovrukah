import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminCategoryDto } from './dto/category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AdminServiceTemplateDto } from './dto/service-template.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(): Promise<AdminCategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return categories.map((category) => AdminCategoryDto.fromEntity(category));
  }

  async getCategory(id: string): Promise<AdminCategoryDto> {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    return AdminCategoryDto.fromEntity(category);
  }

  async createCategory(dto: CreateCategoryDto): Promise<AdminCategoryDto> {
    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? null,
      },
    });

    return AdminCategoryDto.fromEntity(category);
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<AdminCategoryDto> {
    const category = await this.prisma.category
      .update({
        where: { id },
        data: {
          name: dto.name ?? undefined,
          slug: dto.slug ?? undefined,
          description:
            dto.description === undefined ? undefined : dto.description,
        },
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException('Категория не найдена');
        }
        throw error;
      });

    return AdminCategoryDto.fromEntity(category);
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Категория не найдена');
      }
      throw error;
    }
  }

  async listServices(): Promise<AdminServiceTemplateDto[]> {
    const templates = await this.prisma.serviceTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        category: true,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });

    return templates.map((template) =>
      AdminServiceTemplateDto.fromEntity(template),
    );
  }

  async getService(id: string): Promise<AdminServiceTemplateDto> {
    const template = await this.prisma.serviceTemplate.findUnique({
      where: { id },
      include: {
        category: true,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });

    if (!template) {
      throw new NotFoundException('Услуга не найдена');
    }

    return AdminServiceTemplateDto.fromEntity(template);
  }

  async createService(dto: CreateServiceDto): Promise<AdminServiceTemplateDto> {
    const medianPrice =
      dto.medianPrice === undefined || dto.medianPrice === null
        ? null
        : new Prisma.Decimal(dto.medianPrice);

    const template = await this.prisma.serviceTemplate.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? null,
        medianPrice,
        authorId: dto.authorId ?? null,
        keeperId: dto.keeperId ?? null,
        versions: {
          create: {
            versionNumber: 1,
            title: dto.version.title,
            description: dto.version.description,
            whatsIncluded: dto.version.whatsIncluded ?? [],
            whatsNotIncluded: dto.version.whatsNotIncluded ?? [],
            unitOfMeasure: dto.version.unitOfMeasure,
            requiredTools: dto.version.requiredTools ?? [],
            customerRequirements: dto.version.customerRequirements ?? [],
            estimatedTime: dto.version.estimatedTime ?? null,
            maxTimeIncluded: dto.version.maxTimeIncluded ?? null,
            media: dto.version.media ?? [],
            isActive: true,
          },
        },
      },
      include: {
        category: true,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });

    return AdminServiceTemplateDto.fromEntity(template);
  }

  async updateService(
    id: string,
    dto: UpdateServiceDto,
  ): Promise<AdminServiceTemplateDto> {
    let medianPrice: Prisma.Decimal | null | undefined;
    if (dto.medianPrice === undefined) {
      medianPrice = undefined;
    } else if (dto.medianPrice === null) {
      medianPrice = null;
    } else {
      medianPrice = new Prisma.Decimal(dto.medianPrice);
    }

    const template = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.serviceTemplate.findUnique({
        where: { id },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      });

      if (!existing) {
        throw new NotFoundException('Услуга не найдена');
      }

      const updateData: Prisma.ServiceTemplateUpdateInput = {};
      if (dto.categoryId !== undefined) {
        updateData.category = { connect: { id: dto.categoryId } };
      }
      if (dto.name !== undefined) {
        updateData.name = dto.name;
      }
      if (dto.slug !== undefined) {
        updateData.slug = dto.slug;
      }
      if (dto.description !== undefined) {
        updateData.description = dto.description;
      }
      if (medianPrice !== undefined) {
        updateData.medianPrice = medianPrice;
      }
      if (dto.authorId !== undefined) {
        updateData.authorId = dto.authorId;
      }
      if (dto.keeperId !== undefined) {
        updateData.keeperId = dto.keeperId;
      }

      await tx.serviceTemplate.update({
        where: { id },
        data: updateData,
      });

      await tx.serviceTemplateVersion.updateMany({
        where: { serviceTemplateId: id },
        data: { isActive: false },
      });

      const latestVersionNumber = existing.versions.at(0)?.versionNumber ?? 0;

      await tx.serviceTemplateVersion.create({
        data: {
          serviceTemplateId: id,
          versionNumber: latestVersionNumber + 1,
          title: dto.version.title,
          description: dto.version.description,
          whatsIncluded: dto.version.whatsIncluded ?? [],
          whatsNotIncluded: dto.version.whatsNotIncluded ?? [],
          unitOfMeasure: dto.version.unitOfMeasure,
          requiredTools: dto.version.requiredTools ?? [],
          customerRequirements: dto.version.customerRequirements ?? [],
          estimatedTime: dto.version.estimatedTime ?? null,
          maxTimeIncluded: dto.version.maxTimeIncluded ?? null,
          media: dto.version.media ?? [],
          isActive: true,
        },
      });

      return tx.serviceTemplate.findUniqueOrThrow({
        where: { id },
        include: {
          category: true,
          versions: { orderBy: { versionNumber: 'desc' } },
        },
      });
    });

    return AdminServiceTemplateDto.fromEntity(template);
  }

  async deleteService(id: string): Promise<void> {
    try {
      await this.prisma.serviceTemplate.delete({ where: { id } });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Услуга не найдена');
      }
      throw error;
    }
  }
}
