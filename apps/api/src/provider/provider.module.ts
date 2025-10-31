import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from '../auth/roles.guard';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';

@Module({
  imports: [PrismaModule, CatalogModule],
  controllers: [ProviderController],
  providers: [ProviderService, RolesGuard],
})
export class ProviderModule {}
