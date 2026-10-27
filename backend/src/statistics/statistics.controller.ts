
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('vehicles/:vehicleId/statistics')
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
  ) {}

  @Get()
  getVehicleStatistics(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.statisticsService.getVehicleStatistics(vehicleId);
  }
}
