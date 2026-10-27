import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { VehicleLogType } from '../vehicle-log.types';

export class CreateVehicleLogDto {
  @IsIn(Object.values(VehicleLogType))
  type!: VehicleLogType;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @IsInt()
  @Min(0)
  amountMillimes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
