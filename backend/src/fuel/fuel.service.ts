import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';

@Injectable()
export class FuelService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.prisma.fuelLog.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });
  }

  async create(vehicleId: string, dto: CreateFuelLogDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
        currentMileage: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (dto.mileage < vehicle.currentMileage) {
      throw new BadRequestException(
        `Mileage cannot be lower than the current mileage (${vehicle.currentMileage} km).`,
      );
    }

    const date = dto.date ? new Date(dto.date) : new Date();

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid refuelling date.');
    }

    return this.prisma.$transaction(async (tx) => {
      const fuelLog = await tx.fuelLog.create({
        data: {
          vehicleId,
          date,
          mileage: dto.mileage,
          liters: dto.liters,
          totalCostMillimes: dto.totalCostMillimes,
          fuelType: dto.fuelType?.trim() || null,
          note: dto.note?.trim() || null,
        },
      });

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { currentMileage: dto.mileage },
      });

      return fuelLog;
    });
  }
}
