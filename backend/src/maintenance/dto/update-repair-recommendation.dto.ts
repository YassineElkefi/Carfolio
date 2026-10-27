import { PartialType } from '@nestjs/mapped-types';
import { CreateRepairRecommendationDto } from './create-repair-recommendation.dto';

export class UpdateRepairRecommendationDto extends PartialType(
  CreateRepairRecommendationDto,
) {}
