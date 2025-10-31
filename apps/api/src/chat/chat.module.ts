import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatGateway } from './chat.gateway';
import { WsAuthGuard } from '../auth/ws-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, OrdersModule, AuthModule],
  providers: [ChatGateway, WsAuthGuard],
  exports: [ChatGateway],
})
export class ChatModule {}
