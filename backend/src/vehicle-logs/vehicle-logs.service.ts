import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleLogDto } from './dto/create-vehicle-log.dto';
import { UpdateVehicleLogDto } from './dto/update-vehicle-log.dto';
import { MILEAGE_LOG_TYPES, VehicleLogType } from './vehicle-log.types';

@Injectable()
export class VehicleLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(vehicleId: string, dto: CreateVehicleLogDto) {
    await this.ensureVehicleExists(vehicleId);
    this.validateMileage(dto.type, dto.mileage);
    if (dto.type === VehicleLogType.ROAD_TAX && dto.mileage !== undefined) {
      throw new BadRequestException('Mileage does not apply to road tax logs.');
    }

    return this.prisma.vehicleLog.create({
      data: {
        vehicleId,
        type: dto.type,
        date: new Date(dto.date),
        mileage: this.getMileage(dto.type, dto.mileage),
        amountMillimes: dto.amountMillimes,
        notes: dto.notes,
      },
    });
  }

  async findAll(vehicleId: string) {
    await this.ensureVehicleExists(vehicleId);

    return this.prisma.vehicleLog.findMany({
      where: { vehicleId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(vehicleId: string, id: string) {
    const record = await this.prisma.vehicleLog.findFirst({
      where: { id, vehicleId },
    });

    if (!record) {
      throw new NotFoundException('Vehicle log not found.');
    }

    return record;
  }

  async update(vehicleId: string, id: string, dto: UpdateVehicleLogDto) {
    const existing = await this.findOne(vehicleId, id);
    const type = dto.type ?? (existing.type as VehicleLogType);
    const mileage = dto.mileage === undefined ? existing.mileage : dto.mileage;
    this.validateMileage(type, mileage ?? undefined);
    if (type === VehicleLogType.ROAD_TAX && dto.mileage !== undefined) {
      throw new BadRequestException('Mileage does not apply to road tax logs.');
    }

    return this.prisma.vehicleLog.update({
      where: { id },
      data: {
        type: dto.type,
        date: dto.date === undefined ? undefined : new Date(dto.date),
        mileage: this.getMileage(type, mileage ?? undefined),
        amountMillimes: dto.amountMillimes,
        notes: dto.notes,
      },
    });
  }

  async remove(vehicleId: string, id: string) {
    await this.findOne(vehicleId, id);
    await this.prisma.vehicleLog.delete({ where: { id } });

    return { message: 'Vehicle log deleted successfully.' };
  }

  private async ensureVehicleExists(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }
  }

  private validateMileage(type: VehicleLogType, mileage?: number | null) {
    if (MILEAGE_LOG_TYPES.includes(type) && mileage === undefined) {
      throw new BadRequestException(
        'Mileage is required for technical inspections and oil/filter changes.',
      );
    }
  }

  private getMileage(type: VehicleLogType, mileage?: number) {
    return type === VehicleLogType.ROAD_TAX ? null : mileage;
  }
}
