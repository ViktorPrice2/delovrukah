import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
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

export interface ChatMessageResponseDto {
  id: string;
  orderId: string;
  senderId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

interface UserContext {
  role: Role;
  customerProfileId: string | null;
  providerProfileId: string | null;
}

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
      const key = this.getServiceKey(
        service.providerId,
        service.serviceTemplateVersionId,
      );
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

  async getOrders(userId: string): Promise<OrderResponseDto[]> {
    const context = await this.getUserContext(userId);

    let orders: OrderWithItems[] = [];

    if (context.role === Role.CUSTOMER) {
      const customerProfileId = context.customerProfileId!;
      orders = await this.prisma.order.findMany({
        where: { customerProfileId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
    } else if (context.role === Role.PROVIDER) {
      const providerProfileId = context.providerProfileId!;
      orders = await this.prisma.order.findMany({
        where: {
          items: {
            some: { providerProfileId },
          },
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return orders.map((order) => this.mapOrder(order));
  }

  async getOrderById(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    const context = await this.getUserContext(userId);
    const order = await this.findAuthorizedOrder(context, orderId);

    return this.mapOrder(order);
  }

  async getOrderMessages(
    userId: string,
    orderId: string,
  ): Promise<ChatMessageResponseDto[]> {
    const context = await this.getUserContext(userId);
    await this.findAuthorizedOrder(context, orderId);

    const messages = await this.prisma.chatMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((message) => ({
      id: message.id,
      orderId: message.orderId,
      senderId: message.senderId,
      text: message.text,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    }));
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

  private getServiceKey(
    providerId: string,
    serviceTemplateVersionId: string,
  ): string {
    return `${providerId}:${serviceTemplateVersionId}`;
  }

  private async getUserContext(userId: string): Promise<UserContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        customerProfile: { select: { id: true } },
        providerProfile: { select: { id: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.CUSTOMER && !user.customerProfile) {
      throw new NotFoundException('Customer profile not found');
    }

    if (user.role === Role.PROVIDER && !user.providerProfile) {
      throw new NotFoundException('Provider profile not found');
    }

    return {
      role: user.role,
      customerProfileId: user.customerProfile?.id ?? null,
      providerProfileId: user.providerProfile?.id ?? null,
    };
  }

  private async findAuthorizedOrder(
    context: UserContext,
    orderId: string,
  ): Promise<OrderWithItems> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.isUserParticipant(context, order)) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private isUserParticipant(
    context: UserContext,
    order: OrderWithItems,
  ): boolean {
    if (context.role === Role.CUSTOMER) {
      return (
        !!context.customerProfileId &&
        order.customerProfileId === context.customerProfileId
      );
    }

    if (context.role === Role.PROVIDER) {
      if (!context.providerProfileId) {
        return false;
      }

      return order.items.some(
        (item) => item.providerProfileId === context.providerProfileId,
      );
    }

    return false;
  }
}
