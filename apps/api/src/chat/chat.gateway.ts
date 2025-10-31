import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import {
  ChatMessageResponseDto,
  OrdersService,
} from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { UseGuards } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt.strategy';
import { AuthenticatedSocket, WsAuthGuard } from '../auth/ws-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: { origin: '*' } })
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      console.log('[ChatGateway] handleConnection start', client.id);
      const payload = await this.authenticateClient(client);
      console.log('[ChatGateway] handleConnection success', client.id, payload.sub);
    } catch (error) {
      console.log('[ChatGateway] handleConnection error', client.id, error);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    console.log('[ChatGateway] handleDisconnect', client.id);
    client.leaveAll();
  }

  @SubscribeMessage('joinOrder')
  async handleJoinOrder(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId?: string },
  ): Promise<{ room: string }> {
    const user = await this.getAuthenticatedUser(client);
    const orderId = data?.orderId;

    if (!orderId) {
      throw new WsException('Order ID is required');
    }

    await this.ordersService.getOrderById(user.sub, orderId);

    const room = this.getRoomName(orderId);
    await client.join(room);

    return { room };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { orderId?: string; text?: string },
  ): Promise<ChatMessageResponseDto> {
    const user = await this.getAuthenticatedUser(client);
    const orderId = data?.orderId;
    const trimmedText = data?.text?.trim();

    if (!orderId) {
      throw new WsException('Order ID is required');
    }

    if (!trimmedText) {
      throw new WsException('Message text is required');
    }

    await this.ordersService.getOrderById(user.sub, orderId);

    const message = await this.prisma.chatMessage.create({
      data: {
        orderId,
        senderId: user.sub,
        text: trimmedText,
      },
    });

    const payload: ChatMessageResponseDto = {
      id: message.id,
      orderId: message.orderId,
      senderId: message.senderId,
      text: message.text,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };

    this.server.to(this.getRoomName(orderId)).emit('newMessage', payload);

    return payload;
  }

  private async getAuthenticatedUser(
    client: AuthenticatedSocket,
  ): Promise<JwtPayload> {
    if (client.user) {
      return client.user as JwtPayload;
    }

    return this.authenticateClient(client);
  }

  private getRoomName(orderId: string): string {
    return `order-${orderId}`;
  }

  private async authenticateClient(
    client: AuthenticatedSocket,
  ): Promise<JwtPayload> {
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Unauthorized');
    }

    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new WsException('Server configuration error');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });

      client.user = payload;
      return payload;
    } catch (error) {
      console.log('[ChatGateway] authenticateClient error', client.id, error);
      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: AuthenticatedSocket): string | null {
    const authHeader = client.handshake.headers.authorization;

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    const tokenFromQuery = client.handshake.query?.token;

    if (typeof tokenFromQuery === 'string') {
      return tokenFromQuery;
    }

    const handshakeAuth = client.handshake.auth as
      | { token?: unknown }
      | undefined;

    if (handshakeAuth && typeof handshakeAuth.token === 'string') {
      return handshakeAuth.token;
    }

    return null;
  }
}
