
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const DEADLINE_TYPES = [
  'insurance',
  'technical_inspection',
  'road_tax',
  'maintenance',
] as const;

export class CreateDeadlineDto {
  @IsIn(DEADLINE_TYPES)
  type!: (typeof DEADLINE_TYPES)[number];

  @IsString()
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dueMileage?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountMillimes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
