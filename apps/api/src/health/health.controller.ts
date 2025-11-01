import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface HealthCheckResponse {
  status: 'ok';
  services: {
    database: 'up' | 'down';
  };
  timestamp: string;
}

@Controller('health')
export class HealthController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  getHealth(): HealthCheckResponse {
    const databaseStatus = this.prismaService.isDatabaseAvailable
      ? 'up'
      : 'down';

    return {
      status: 'ok',
      services: {
        database: databaseStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
