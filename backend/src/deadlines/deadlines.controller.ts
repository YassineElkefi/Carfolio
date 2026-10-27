
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

import { DeadlinesService } from './deadlines.service';
import { CreateDeadlineDto } from './dto/create-deadline.dto';
import { UpdateDeadlineDto } from './dto/update-deadline.dto';
import { CompleteDeadlineDto } from './dto/complete-deadline.dto';

@Controller('vehicles/:vehicleId/deadlines')
export class DeadlinesController {
  constructor(private readonly deadlinesService: DeadlinesService) {}

  @Post()
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: CreateDeadlineDto,
  ) {
    return this.deadlinesService.create(vehicleId, dto);
  }

  @Get()
  findAll(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.deadlinesService.findAll(vehicleId);
  }

  @Get(':id')
  findOne(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deadlinesService.findOne(vehicleId, id);
  }

  @Patch(':id')
  update(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeadlineDto,
  ) {
    return this.deadlinesService.update(vehicleId, id, dto);
  }

  @Patch(':id/complete')
  complete(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteDeadlineDto,
  ) {
    return this.deadlinesService.complete(vehicleId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deadlinesService.remove(vehicleId, id);
  }
}
