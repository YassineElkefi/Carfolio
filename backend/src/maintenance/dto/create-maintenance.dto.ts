import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMaintenanceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  itemName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsDateString()
  maintenanceDate?: string;

  @IsInt()
  @Min(0)
  mileage!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  partCostMillimes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  laborCostMillimes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  mechanicName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}