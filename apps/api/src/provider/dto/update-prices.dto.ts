import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
  IsNumber,
} from 'class-validator';

export class ProviderPriceUpdateDto {
  @IsString()
  serviceTemplateVersionId!: string;

  @ValidateIf((dto) => dto.price !== null && dto.price !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number | null;
}

export class UpdateProviderPricesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ProviderPriceUpdateDto)
  prices!: ProviderPriceUpdateDto[];
}
