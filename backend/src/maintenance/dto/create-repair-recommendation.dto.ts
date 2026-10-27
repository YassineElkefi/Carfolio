import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRepairRecommendationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  partName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  mechanicName!: string;

  @IsOptional()
  @IsDateString()
  recommendedAt?: string;

  @IsOptional()
  @IsBoolean()
  isBought?: boolean;

  @IsOptional()
  @IsBoolean()
  isMounted?: boolean;
}
