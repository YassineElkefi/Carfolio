import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateRepairRecommendationDto } from './dto/create-repair-recommendation.dto';
import { UpdateRepairRecommendationDto } from './dto/update-repair-recommendation.dto';
import { RepairRecommendationsService } from './repair-recommendations.service';

@Controller('vehicles/:vehicleId/repair-recommendations')
export class RepairRecommendationsController {
  constructor(
    private readonly repairRecommendationsService: RepairRecommendationsService,
  ) {}

  @Get()
  findAll(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.repairRecommendationsService.findAll(vehicleId);
  }

  @Post()
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: CreateRepairRecommendationDto,
  ) {
    return this.repairRecommendationsService.create(vehicleId, dto);
  }

  @Patch(':id')
  update(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRepairRecommendationDto,
  ) {
    return this.repairRecommendationsService.update(vehicleId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.repairRecommendationsService.remove(vehicleId, id);
  }
}
