import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateServiceVersionDto } from './create-service.dto';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  medianPrice?: number | null;

  @IsOptional()
  @IsString()
  authorId?: string | null;

  @IsOptional()
  @IsString()
  keeperId?: string | null;

  @ValidateNested()
  @Type(() => CreateServiceVersionDto)
  version!: CreateServiceVersionDto;
}
