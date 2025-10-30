import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProviderService } from './provider.service';
import { ProviderPriceDto } from './dto/provider-price.dto';

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
}
