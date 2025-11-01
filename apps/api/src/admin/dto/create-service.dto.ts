import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';

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

  @IsString()
  @IsNotEmpty()
  estimatedTime!: string;

  @IsOptional()
  @IsNumber()
  maxTimeIncluded?: number | null;

  @IsOptional()
  media?: Prisma.JsonValue | null;
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
