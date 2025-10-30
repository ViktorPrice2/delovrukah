import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderPriceDto } from './dto/provider-price.dto';
import { ProviderProfileDto } from './dto/provider-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpsertPriceDto } from './dto/upsert-price.dto';

@Injectable()
export class ProviderService {
  constructor(private readonly prisma: PrismaService) {}

  async getProviderPrices(userId: string): Promise<ProviderPriceDto[]> {
    const providerProfile = await this.prisma.providerProfile.findUnique({
      where: { userId },
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

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProviderProfileDto> {
    const providerProfile = await this.prisma.providerProfile.findUnique({
      where: { userId },
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
        createdAt: providerProfile.createdAt,
        updatedAt: providerProfile.updatedAt,
      };
    }

    const updatedProfile = await this.prisma.providerProfile.update({
      where: { id: providerProfile.id },
      data,
    });

    return {
      id: updatedProfile.id,
      displayName: updatedProfile.displayName,
      description: updatedProfile.description ?? null,
      cityId: updatedProfile.cityId ?? null,
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt,
    };
  }

  async upsertPrice(
    userId: string,
    dto: UpsertPriceDto,
  ): Promise<ProviderPriceDto> {
    const providerProfile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!providerProfile) {
      throw new NotFoundException('Provider profile not found');
    }

    const decimalPrice = new Prisma.Decimal(dto.price);

    const price = await this.prisma.price.upsert({
      where: {
        providerProfileId_serviceTemplateVersionId: {
          providerProfileId: providerProfile.id,
          serviceTemplateVersionId: dto.serviceTemplateVersionId,
        },
      },
      update: { price: decimalPrice },
      create: {
        providerProfileId: providerProfile.id,
        serviceTemplateVersionId: dto.serviceTemplateVersionId,
        price: decimalPrice,
      },
    });

    return {
      id: price.id,
      serviceTemplateVersionId: price.serviceTemplateVersionId,
      price: price.price.toNumber(),
      createdAt: price.createdAt,
      updatedAt: price.updatedAt,
    };
  }
}
