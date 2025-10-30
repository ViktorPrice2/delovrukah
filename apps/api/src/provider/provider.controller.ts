import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { ProviderService } from './provider.service';
import { ProviderPriceDto } from './dto/provider-price.dto';

type RequestWithUser = Request & { user: JwtPayload };

@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @UseGuards(JwtAuthGuard)
  @Get('prices')
  getProviderPrices(@Req() req: RequestWithUser): Promise<ProviderPriceDto[]> {
    return this.providerService.getProviderPrices(req.user.sub);
  }
}
