import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(vehicleId: string, dto: CreateMaintenanceDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    if (dto.mileage < vehicle.currentMileage) {
      throw new BadRequestException(
        `Mileage must be at least ${vehicle.currentMileage} km.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.create({
        data: {
          vehicleId,
          itemName: dto.itemName,
          category: dto.category,
          purchaseDate: dto.purchaseDate
            ? new Date(dto.purchaseDate)
            : undefined,
          maintenanceDate: dto.maintenanceDate
            ? new Date(dto.maintenanceDate)
            : undefined,
          mileage: dto.mileage,
          partCostMillimes: dto.partCostMillimes ?? 0,
          laborCostMillimes: dto.laborCostMillimes ?? 0,
          mechanicName: dto.mechanicName,
          notes: dto.notes,
        },
      });

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { currentMileage: dto.mileage },
      });

      return record;
    });
  }

  async findAll(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    return this.prisma.maintenanceRecord.findMany({
      where: { vehicleId },
      orderBy: { maintenanceDate: 'desc' },
    });
  }

  async findOne(vehicleId: string, id: string) {
    const record = await this.prisma.maintenanceRecord.findFirst({
      where: { id, vehicleId },
    });

    if (!record) {
      throw new NotFoundException('Maintenance record not found.');
    }

    return record;
  }

  async update(
    vehicleId: string,
    id: string,
    dto: UpdateMaintenanceDto,
  ) {
    await this.findOne(vehicleId, id);

    if (dto.mileage !== undefined) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException('Vehicle not found.');
      }

      if (dto.mileage < vehicle.currentMileage) {
        throw new BadRequestException(
          `Mileage must be at least ${vehicle.currentMileage} km.`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.update({
        where: { id },
        data: {
          ...dto,
          purchaseDate:
            dto.purchaseDate === undefined
              ? undefined
              : dto.purchaseDate === null
                ? null
                : new Date(dto.purchaseDate),
          maintenanceDate:
            dto.maintenanceDate === undefined
              ? undefined
              : new Date(dto.maintenanceDate),
        },
      });

      if (dto.mileage !== undefined) {
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: { currentMileage: dto.mileage },
        });
      }

      return record;
    });
  }

  async remove(vehicleId: string, id: string) {
    await this.findOne(vehicleId, id);

    await this.prisma.maintenanceRecord.delete({
      where: { id },
    });

    return { message: 'Maintenance record deleted successfully.' };
  }
}