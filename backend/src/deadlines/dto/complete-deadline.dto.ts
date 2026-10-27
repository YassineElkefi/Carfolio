import { IsInt, IsOptional, Min } from 'class-validator';

export class CompleteDeadlineDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  completedMileage?: number;
}
