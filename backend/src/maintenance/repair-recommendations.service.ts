import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRepairRecommendationDto } from './dto/create-repair-recommendation.dto';
import { UpdateRepairRecommendationDto } from './dto/update-repair-recommendation.dto';

@Injectable()
export class RepairRecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    return this.prisma.repairRecommendation.findMany({
      where: { vehicleId },
      orderBy: { recommendedAt: 'desc' },
    });
  }

  async create(vehicleId: string, dto: CreateRepairRecommendationDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    return this.prisma.repairRecommendation.create({
      data: {
        vehicleId,
        partName: dto.partName,
        mechanicName: dto.mechanicName,
        recommendedAt: dto.recommendedAt
          ? new Date(dto.recommendedAt)
          : undefined,
        isBought: dto.isBought,
        isMounted: dto.isMounted,
      },
    });
  }

  async update(
    vehicleId: string,
    id: string,
    dto: UpdateRepairRecommendationDto,
  ) {
    await this.findOne(vehicleId, id);

    return this.prisma.repairRecommendation.update({
      where: { id },
      data: {
        partName: dto.partName,
        mechanicName: dto.mechanicName,
        isBought: dto.isBought,
        isMounted: dto.isMounted,
        recommendedAt:
          dto.recommendedAt === undefined
            ? undefined
            : new Date(dto.recommendedAt),
      },
    });
  }

  async remove(vehicleId: string, id: string) {
    await this.findOne(vehicleId, id);

    await this.prisma.repairRecommendation.delete({ where: { id } });

    return { message: 'Repair recommendation deleted successfully.' };
  }

  private async findOne(vehicleId: string, id: string) {
    const recommendation = await this.prisma.repairRecommendation.findFirst({
      where: { id, vehicleId },
    });

    if (!recommendation) {
      throw new NotFoundException('Repair recommendation not found.');
    }

    return recommendation;
  }
}
