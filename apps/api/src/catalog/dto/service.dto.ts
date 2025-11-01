import type { Prisma } from '@prisma/client';
import type { CityDto } from '../../geo/dto/city.dto';
import type { CategoryDto } from './category.dto';

export class ServiceVersionDto {
  id: string;
  versionNumber: number;
  title: string;
  description: string;
  whatsIncluded: Prisma.JsonValue;
  whatsNotIncluded: Prisma.JsonValue;
  unitOfMeasure: string;
  requiredTools: Prisma.JsonValue;
  customerRequirements: Prisma.JsonValue;
  media: Prisma.JsonValue;
  estimatedTime: string | null;
  maxTimeIncluded: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ServiceSummaryDto {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  latestVersion: ServiceVersionDto | null;
  slug: string;
  medianPrice: number | null;
  estimatedTime: string | null;
  maxTimeIncluded: number | null;
}

export class ServiceProviderDto {
  id: string;
  displayName: string;
  description: string | null;
  price: number;
  city: CityDto;
  hourlyRate: number | null;
  estimatedTime: string | null;
}

export class ServiceDetailDto extends ServiceSummaryDto {
  authorId: string | null;
  keeperId: string | null;
  category: CategoryDto;
  providers?: ServiceProviderDto[];
}
