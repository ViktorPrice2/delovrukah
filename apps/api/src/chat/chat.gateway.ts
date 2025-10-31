import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/jwt.strategy';
import {
  ChatMessageResponseDto,
  OrdersService,
} from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const payload = await this.verifyClient(client);
      client.user = payload;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
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
    if (!client.user) {
      const payload = await this.verifyClient(client);
      client.user = payload;
    }

    if (!client.user) {
      throw new WsException('Unauthorized');
    }

    return client.user;
  }

  private async verifyClient(client: AuthenticatedSocket): Promise<JwtPayload> {
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

      return payload;
    } catch {
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

  private getRoomName(orderId: string): string {
    return `order-${orderId}`;
  }
}
