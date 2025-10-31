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
import { AuthenticatedSocket, WsJwtGuard } from './ws-jwt.guard';
import { UseGuards } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt.strategy';

@WebSocketGateway({ cors: { origin: '*' } })
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly wsJwtGuard: WsJwtGuard,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      console.log('[ChatGateway] handleConnection start', client.id);
      const payload = await this.wsJwtGuard.validateClient(client);
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
      return client.user;
    }

    return this.wsJwtGuard.validateClient(client);
  }

  private getRoomName(orderId: string): string {
    return `order-${orderId}`;
  }
}
