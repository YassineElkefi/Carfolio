import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateFuelLogDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsInt()
  @Min(0)
  mileage: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  liters: number;

  @IsInt()
  @Min(1)
  totalCostMillimes: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @MinLength(1)
  fuelType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
