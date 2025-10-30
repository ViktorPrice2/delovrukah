import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProviderService } from './provider.service';
import { ProviderPriceDto } from './dto/provider-price.dto';
import { ProviderProfileDto } from './dto/provider-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpsertPriceDto } from './dto/upsert-price.dto';

type RequestWithUser = Request & { user: JwtPayload };

@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('prices')
  getProviderPrices(@Req() req: RequestWithUser): Promise<ProviderPriceDto[]> {
    return this.providerService.getProviderPrices(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('profile')
  updateProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProviderProfileDto> {
    return this.providerService.updateProfile(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('prices')
  upsertPrice(
    @Req() req: RequestWithUser,
    @Body() dto: UpsertPriceDto,
  ): Promise<ProviderPriceDto> {
    return this.providerService.upsertPrice(req.user.sub, dto);
  }
}
