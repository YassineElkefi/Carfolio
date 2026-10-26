import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { FuelService } from './fuel.service';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';

@Controller('vehicles/:vehicleId/fuel')
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @Get()
  findAll(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.fuelService.findAll(vehicleId);
  }

  @Post()
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: CreateFuelLogDto,
  ) {
    return this.fuelService.create(vehicleId, dto);
  }
}
