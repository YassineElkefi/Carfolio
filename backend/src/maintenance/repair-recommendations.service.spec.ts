import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RepairRecommendationsService } from './repair-recommendations.service';

describe('RepairRecommendationsService', () => {
  let service: RepairRecommendationsService;
  const prisma = {
    vehicle: {
      findUnique: jest.fn(),
    },
    repairRecommendation: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepairRecommendationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RepairRecommendationsService>(
      RepairRecommendationsService,
    );
  });

  it('lists recommendations for a vehicle in recommendation-date order', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-id' });
    prisma.repairRecommendation.findMany.mockResolvedValue([]);

    await expect(service.findAll('vehicle-id')).resolves.toEqual([]);
    expect(prisma.repairRecommendation.findMany).toHaveBeenCalledWith({
      where: { vehicleId: 'vehicle-id' },
      orderBy: { recommendedAt: 'desc' },
    });
  });

  it('creates a recommendation with its status and recommendation date', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-id' });
    prisma.repairRecommendation.create.mockResolvedValue({ id: 'repair-id' });
    const recommendedAt = '2026-10-27';

    await service.create('vehicle-id', {
      partName: 'Brake pads',
      mechanicName: 'Garage',
      recommendedAt,
      isBought: true,
    });

    expect(prisma.repairRecommendation.create).toHaveBeenCalledWith({
      data: {
        vehicleId: 'vehicle-id',
        partName: 'Brake pads',
        mechanicName: 'Garage',
        recommendedAt: new Date(recommendedAt),
        isBought: true,
        isMounted: undefined,
      },
    });
  });

  it('does not update a recommendation belonging to another vehicle', async () => {
    prisma.repairRecommendation.findFirst.mockResolvedValue(null);

    await expect(
      service.update('vehicle-id', 'repair-id', { isBought: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.repairRecommendation.update).not.toHaveBeenCalled();
  });
});
