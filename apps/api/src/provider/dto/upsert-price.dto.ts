import { IsNumber, IsString, Min } from 'class-validator';

export class UpsertPriceDto {
  @IsString()
  serviceTemplateVersionId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;
}
