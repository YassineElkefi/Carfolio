import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleLogDto } from './create-vehicle-log.dto';

export class UpdateVehicleLogDto extends PartialType(CreateVehicleLogDto) {}
