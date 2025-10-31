import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ChatMessageResponseDto,
  OrderResponseDto,
  OrdersService,
} from './orders.service';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(Role.CUSTOMER, Role.PROVIDER)
  @Get()
  getOrders(@Req() req: RequestWithUser): Promise<OrderResponseDto[]> {
    return this.ordersService.getOrders(req.user.sub);
  }

  @Roles(Role.CUSTOMER)
  @Post()
  createOrder(
    @Req() req: RequestWithUser,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(req.user.sub, dto);
  }

  @Roles(Role.CUSTOMER, Role.PROVIDER)
  @Get(':id')
  getOrderById(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.getOrderById(req.user.sub, id);
  }

  @Roles(Role.CUSTOMER, Role.PROVIDER)
  @Get(':id/messages')
  getOrderMessages(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<ChatMessageResponseDto[]> {
    return this.ordersService.getOrderMessages(req.user.sub, id);
  }
}
