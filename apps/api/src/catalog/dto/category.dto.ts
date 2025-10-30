import type { ServiceSummaryDto } from './service.dto';

export class CategoryDto {
  id: string;
  name: string;
  description: string | null;
}

export class CategoryWithServicesDto extends CategoryDto {
  services: ServiceSummaryDto[];
}
