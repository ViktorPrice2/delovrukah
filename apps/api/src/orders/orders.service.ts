import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, Price } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

export interface OrderItemResponseDto {
  id: string;
  providerProfileId: string;
  serviceTemplateVersionId: string;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderResponseDto {
  id: string;
  customerProfileId: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemResponseDto[];
}

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const customerProfile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!customerProfile) {
      throw new NotFoundException('Customer profile not found');
    }

    const uniqueServiceKeys = new Map<
      string,
      { providerId: string; serviceTemplateVersionId: string }
    >();

    for (const service of dto.services) {
      const key = this.getServiceKey(service.providerId, service.serviceTemplateVersionId);
      if (!uniqueServiceKeys.has(key)) {
        uniqueServiceKeys.set(key, {
          providerId: service.providerId,
          serviceTemplateVersionId: service.serviceTemplateVersionId,
        });
      }
    }

    const prices = await this.prisma.price.findMany({
      where: {
        OR: Array.from(uniqueServiceKeys.values()).map((service) => ({
          providerProfileId: service.providerId,
          serviceTemplateVersionId: service.serviceTemplateVersionId,
        })),
      },
    });

    const priceMap = this.mapPrices(prices);

    for (const service of uniqueServiceKeys.values()) {
      const key = this.getServiceKey(
        service.providerId,
        service.serviceTemplateVersionId,
      );
      if (!priceMap.has(key)) {
        throw new NotFoundException(
          `Price not found for provider ${service.providerId} and service version ${service.serviceTemplateVersionId}`,
        );
      }
    }

    const order = await this.prisma.order.create({
      data: {
        customerProfileId: customerProfile.id,
        items: {
          create: dto.services.map((service) => {
            const key = this.getServiceKey(
              service.providerId,
              service.serviceTemplateVersionId,
            );
            const price = priceMap.get(key);
            if (!price) {
              throw new NotFoundException(
                `Price not found for provider ${service.providerId} and service version ${service.serviceTemplateVersionId}`,
              );
            }
            return {
              providerProfileId: service.providerId,
              serviceTemplateVersionId: service.serviceTemplateVersionId,
              price: price.price,
              quantity: service.quantity,
            };
          }),
        },
      },
      include: {
        items: true,
      },
    });

    return this.mapOrder(order);
  }

  async getOrderById(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    const customerProfile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!customerProfile) {
      throw new NotFoundException('Customer profile not found');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.customerProfileId !== customerProfile.id) {
      throw new NotFoundException('Order not found');
    }

    return this.mapOrder(order);
  }

  private mapPrices(prices: Price[]): Map<string, Price> {
    return new Map(
      prices.map((price) => [
        this.getServiceKey(
          price.providerProfileId,
          price.serviceTemplateVersionId,
        ),
        price,
      ]),
    );
  }

  private mapOrder(order: OrderWithItems): OrderResponseDto {
    return {
      id: order.id,
      customerProfileId: order.customerProfileId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        providerProfileId: item.providerProfileId,
        serviceTemplateVersionId: item.serviceTemplateVersionId,
        price: item.price.toNumber(),
        quantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    };
  }

  private getServiceKey(providerId: string, serviceTemplateVersionId: string): string {
    return `${providerId}:${serviceTemplateVersionId}`;
  }
}
