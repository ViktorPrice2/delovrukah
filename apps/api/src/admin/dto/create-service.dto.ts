import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceVersionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @IsString({ each: true })
  whatsIncluded!: string[];

  @IsArray()
  @IsString({ each: true })
  whatsNotIncluded!: string[];

  @IsString()
  @IsNotEmpty()
  unitOfMeasure!: string;

  @IsArray()
  @IsString({ each: true })
  requiredTools!: string[];

  @IsArray()
  @IsString({ each: true })
  customerRequirements!: string[];

  @IsOptional()
  @IsString()
  estimatedTime?: string;

  @IsOptional()
  @IsNumber()
  maxTimeIncluded?: number | null;

  @IsOptional()
  @IsArray()
  media?: unknown[];
}

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

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
