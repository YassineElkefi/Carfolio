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
import { CreateVehicleLogDto } from './dto/create-vehicle-log.dto';
import { UpdateVehicleLogDto } from './dto/update-vehicle-log.dto';
import { VehicleLogsService } from './vehicle-logs.service';

@Controller('vehicles/:vehicleId/logs')
export class VehicleLogsController {
  constructor(private readonly vehicleLogsService: VehicleLogsService) {}

  @Post()
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: CreateVehicleLogDto,
  ) {
    return this.vehicleLogsService.create(vehicleId, dto);
  }

  @Get()
  findAll(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.vehicleLogsService.findAll(vehicleId);
  }

  @Patch(':id')
  update(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleLogDto,
  ) {
    return this.vehicleLogsService.update(vehicleId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehicleLogsService.remove(vehicleId, id);
  }
}
