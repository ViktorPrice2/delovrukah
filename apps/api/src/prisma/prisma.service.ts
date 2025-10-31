// Этот код ПРАВИЛЬНЫЙ
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isAvailable: boolean;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL?.trim();

    super(
      databaseUrl
        ? {
            datasources: {
              db: {
                url: databaseUrl,
              },
            },
          }
        : undefined,
    );

    this.isAvailable = Boolean(databaseUrl);

    if (!this.isAvailable) {
      this.logger.warn(
        'DATABASE_URL is not defined. Prisma client will run in disabled mode and mock data will be used instead.',
      );
    }
  }

  get isDatabaseAvailable(): boolean {
    return this.isAvailable;
  }

  async onModuleInit() {
    if (!this.isAvailable) {
      return;
    }

    try {
      await this.$connect();
    } catch (error) {
      this.isAvailable = false;
      this.logger.error(
        'Failed to connect to the database. Prisma client will be disabled and mock data will be used.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async onModuleDestroy() {
    if (!this.isAvailable) {
      return;
    }

    await this.$disconnect();
  }
}
