import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMileageDto } from './dto/create-mileage.dto';

@Injectable()
export class MileageService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.prisma.mileageRecord.findMany({
      where: { vehicleId },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async create(vehicleId: string, dto: CreateMileageDto) {
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

    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : undefined;

    if (recordedAt && Number.isNaN(recordedAt.getTime())) {
      throw new BadRequestException('Invalid mileage record date.');
    }

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.mileageRecord.create({
        data: {
          vehicleId,
          mileage: dto.mileage,
          ...(recordedAt && { recordedAt }),
          note: dto.note,
        },
      });

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { currentMileage: dto.mileage },
      });

      return record;
    });
  }
}
