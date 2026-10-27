
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeadlineDto } from './dto/create-deadline.dto';
import { UpdateDeadlineDto } from './dto/update-deadline.dto';
import { CompleteDeadlineDto } from './dto/complete-deadline.dto';

@Injectable()
export class DeadlinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(vehicleId: string, dto: CreateDeadlineDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (dto.dueDate === undefined && dto.dueMileage === undefined) {
      throw new BadRequestException(
        'A deadline must have a due date, due mileage, or both',
      );
    }

    return this.prisma.vehicleDeadline.create({
      data: {
        vehicleId,
        type: dto.type,
        title: dto.title,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        dueMileage: dto.dueMileage ?? null,
        amountMillimes: dto.amountMillimes ?? 0,
        notes: dto.notes ?? null,
      },
    });
  }

  async findAll(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.prisma.vehicleDeadline.findMany({
      where: { vehicleId },
      orderBy: [{ dueDate: 'asc' }, { dueMileage: 'asc' }],
    });
  }

  async findOne(vehicleId: string, id: string) {
    const deadline = await this.prisma.vehicleDeadline.findFirst({
      where: { id, vehicleId },
    });

    if (!deadline) {
      throw new NotFoundException('Deadline not found');
    }

    return deadline;
  }

  async update(
    vehicleId: string,
    id: string,
    dto: UpdateDeadlineDto,
  ) {
    await this.findOne(vehicleId, id);

    if (
      dto.dueDate === undefined &&
      dto.dueMileage === undefined
    ) {
      // Updating unrelated fields is allowed.
    }

    return this.prisma.vehicleDeadline.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
        ...(dto.dueMileage !== undefined && {
          dueMileage: dto.dueMileage,
        }),
        ...(dto.amountMillimes !== undefined && {
          amountMillimes: dto.amountMillimes,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async complete(
    vehicleId: string,
    id: string,
    dto: CompleteDeadlineDto,
  ) {
    await this.findOne(vehicleId, id);

    return this.prisma.vehicleDeadline.update({
      where: { id },
      data: {
        completedAt: new Date(),
        completedMileage: dto.completedMileage ?? null,
      },
    });
  }

  async remove(vehicleId: string, id: string) {
    await this.findOne(vehicleId, id);

    await this.prisma.vehicleDeadline.delete({
      where: { id },
    });

    return { message: 'Deadline deleted successfully' };
  }
}
