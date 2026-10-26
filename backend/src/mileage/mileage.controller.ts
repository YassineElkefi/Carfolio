import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { MileageService } from './mileage.service';
import { CreateMileageDto } from './dto/create-mileage.dto';

@Controller('vehicles/:vehicleId/mileage')
export class MileageController {
  constructor(private readonly mileageService: MileageService) {}

  @Get()
  findAll(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.mileageService.findAll(vehicleId);
  }

  @Post()
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: CreateMileageDto,
  ) {
    return this.mileageService.create(vehicleId, dto);
  }
}
