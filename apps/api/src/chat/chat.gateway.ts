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
  chatMessageSelect,
  mapChatMessageResponse,
} from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { UseGuards } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt.strategy';
import { AuthenticatedSocket, WsAuthGuard } from '../auth/ws-auth.guard';
import { AppLogger } from '../logger/app-logger';

interface BroadcastOperator {
  emit(event: string, payload: unknown): void;
}

interface ChatServer {
  to(room: string): BroadcastOperator;
}

@WebSocketGateway()
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: ChatServer;

  private readonly logger = new AppLogger(ChatGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const token = this.extractToken(client);

    if (token) {
      client.handshake.headers.authorization = `Bearer ${token}`;
    }

    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
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
      select: chatMessageSelect,
    });

    const payload: ChatMessageResponseDto = mapChatMessageResponse(message);

    const room = this.getRoomName(orderId);
    this.server.to(room).emit('newMessage', payload);
    this.server.to(room).emit('notification:new-message', payload);

    return payload;
  }

  private getRoomName(orderId: string): string {
    return `order-${orderId}`;
  }

  private extractToken(client: AuthenticatedSocket): string | null {
    const auth = client.handshake.auth as { token?: unknown } | undefined;

    if (auth && typeof auth.token === 'string') {
      const trimmedToken = auth.token.trim();

      if (trimmedToken) {
        return trimmedToken;
      }
    }

    const { authorization } = client.handshake.headers;

    if (typeof authorization === 'string') {
      const prefix = 'Bearer ';

      if (authorization.startsWith(prefix)) {
        return authorization.slice(prefix.length);
      }
    }

    return null;
  }

  private getUserFromClient(client: AuthenticatedSocket): JwtPayload {
    if (client.user) {
      return client.user as JwtPayload;
    }

    throw new WsException('Unauthorized');
  }
}
