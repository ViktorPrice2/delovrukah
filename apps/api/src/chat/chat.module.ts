import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatGateway } from './chat.gateway';
import { WsAuthGuard } from '../auth/ws-auth.guard';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    OrdersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [ChatGateway, WsAuthGuard],
  exports: [ChatGateway],
})
export class ChatModule {}
