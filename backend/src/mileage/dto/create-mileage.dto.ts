import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateMileageDto {
  @IsInt()
  @Min(0)
  mileage: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}