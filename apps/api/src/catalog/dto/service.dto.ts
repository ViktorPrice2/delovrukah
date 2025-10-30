import type { CityDto } from '../../geo/dto/city.dto';
import type { CategoryDto } from './category.dto';

export class ServiceVersionDto {
  id: string;
  versionNumber: number;
  title: string;
  description: string | null;
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
}

export class ServiceProviderDto {
  id: string;
  displayName: string;
  description: string | null;
  price: number;
  city: CityDto;
}

export class ServiceDetailDto extends ServiceSummaryDto {
  authorId: string;
  keeperId: string;
  category: CategoryDto;
  providers?: ServiceProviderDto[];
}
