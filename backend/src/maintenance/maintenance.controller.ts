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
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Controller('vehicles/:vehicleId/maintenance')
export class MaintenanceController {
  constructor(
    private readonly maintenanceService: MaintenanceService,
  ) {}

  @Post()
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: CreateMaintenanceDto,
  ) {
    return this.maintenanceService.create(vehicleId, dto);
  }

  @Get()
  findAll(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.maintenanceService.findAll(vehicleId);
  }

  @Get(':id')
  findOne(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.maintenanceService.findOne(vehicleId, id);
  }

  @Patch(':id')
  update(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    return this.maintenanceService.update(vehicleId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.maintenanceService.remove(vehicleId, id);
  }
}