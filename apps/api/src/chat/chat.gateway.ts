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
import {
  ChatMessageResponseDto,
  OrdersService,
} from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { UseGuards } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt.strategy';
import { AuthenticatedSocket, WsAuthGuard } from '../auth/ws-auth.guard';

interface BroadcastOperator {
  emit(event: string, payload: unknown): void;
}

interface ChatServer {
  to(room: string): BroadcastOperator;
}

@WebSocketGateway({ cors: { origin: '*' } })
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: ChatServer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    console.log('[ChatGateway] handleConnection', client.id);
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
    const user = this.getUserFromClient(client);
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
    const user = this.getUserFromClient(client);
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

  private getRoomName(orderId: string): string {
    return `order-${orderId}`;
  }

  private getUserFromClient(client: AuthenticatedSocket): JwtPayload {
    if (client.user) {
      return client.user as JwtPayload;
    }

    throw new WsException('Unauthorized');
  }
}
