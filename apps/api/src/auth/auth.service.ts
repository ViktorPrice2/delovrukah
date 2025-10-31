import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { resolveJwtSecret } from './jwt-secret.util';

export interface OrderUnreadSummary {
  orderId: string;
  orderNumber: string;
  unreadInOrder: number;
}

export interface NotificationsSummary {
  totalUnreadCount: number;
  ordersWithUnread: OrderUnreadSummary[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<{ access_token: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        ...(dto.role === Role.CUSTOMER
          ? {
              customerProfile: {
                create: {
                  fullName: dto.fullName ?? dto.email,
                },
              },
            }
          : {
              providerProfile: {
                create: {
                  displayName: dto.displayName ?? dto.email,
                },
              },
            }),
      },
    });

    return this.signToken(user.id, user.email, user.role);
  }

  async signin(dto: SigninDto): Promise<{ access_token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id, user.email, user.role);
  }

  async getUnreadNotifications(userId: string): Promise<NotificationsSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const unreadByOrder = await this.prisma.chatMessage.groupBy({
      by: ['orderId'],
      where: {
        isRead: false,
        senderId: { not: userId },
        order: {
          OR: [
            { customerProfile: { userId } },
            { items: { some: { providerProfile: { userId } } } },
          ],
        },
      },
      _count: { orderId: true },
      _max: { createdAt: true },
    });

    if (unreadByOrder.length === 0) {
      return { totalUnreadCount: 0, ordersWithUnread: [] };
    }

    const orderIds = unreadByOrder.map((group) => group.orderId);

    const relatedOrders = await this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true },
    });

    const orderNumberMap = new Map<string, string>();
    relatedOrders.forEach((order) => {
      orderNumberMap.set(order.id, order.id);
    });

    const totalUnreadCount = unreadByOrder.reduce(
      (acc, group) => acc + group._count.orderId,
      0,
    );

    const ordersWithUnread = unreadByOrder
      .map((group) => ({
        orderId: group.orderId,
        orderNumber: orderNumberMap.get(group.orderId) ?? group.orderId,
        unreadInOrder: group._count.orderId,
        latestMessageAt: group._max.createdAt ?? new Date(0),
      }))
      .sort((a, b) => b.latestMessageAt.getTime() - a.latestMessageAt.getTime())
      .map(({ latestMessageAt: _latestMessageAt, ...rest }) => rest);

    return { totalUnreadCount, ordersWithUnread };
  }

  private async signToken(
    userId: string,
    email: string,
    role: Role,
  ): Promise<{ access_token: string }> {
    const payload = { sub: userId, email, role };
    const secret = resolveJwtSecret(this.configService);
    const accessToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '1h',
    });

    return { access_token: accessToken };
  }
}
