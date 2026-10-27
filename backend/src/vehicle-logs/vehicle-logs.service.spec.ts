import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { VehicleLogsService } from './vehicle-logs.service';
import { VehicleLogType } from './vehicle-log.types';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('VehicleLogsService', () => {
  let service: VehicleLogsService;

  const prismaMock = {
    vehicle: {
      findUnique: jest.fn(),
    },
    vehicleLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleLogsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<VehicleLogsService>(VehicleLogsService);
    prismaMock.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-id' });
    prismaMock.vehicleLog.create.mockResolvedValue({ id: 'log-id' });
  });

  it('requires mileage for technical inspections and oil/filter changes', async () => {
    for (const type of [
      VehicleLogType.TECHNICAL_INSPECTION,
      VehicleLogType.OIL_FILTER_CHANGE,
    ]) {
      await expect(
        service.create('vehicle-id', {
          type,
          date: '2026-10-27',
          amountMillimes: 120000,
        }),
      ).rejects.toThrow('Mileage is required');
    }

    expect(prismaMock.vehicleLog.create).not.toHaveBeenCalled();
  });

  it('stores road tax without mileage', async () => {
    await service.create('vehicle-id', {
      type: VehicleLogType.ROAD_TAX,
      date: '2026-10-27',
      amountMillimes: 120000,
    });

    expect(prismaMock.vehicleLog.create).toHaveBeenCalledWith({
      data: {
        vehicleId: 'vehicle-id',
        type: VehicleLogType.ROAD_TAX,
        date: new Date('2026-10-27'),
        mileage: null,
        amountMillimes: 120000,
        notes: undefined,
      },
    });
  });

  it('rejects mileage for road tax logs', async () => {
    await expect(
      service.create('vehicle-id', {
        type: VehicleLogType.ROAD_TAX,
        date: '2026-10-27',
        mileage: 85000,
        amountMillimes: 120000,
      }),
    ).rejects.toThrow('Mileage does not apply');

    expect(prismaMock.vehicleLog.create).not.toHaveBeenCalled();
  });
});
