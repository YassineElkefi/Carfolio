
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getVehicleStatistics(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const [mileageRecords, fuelLogs, maintenanceRecords] =
      await Promise.all([
        this.prisma.mileageRecord.findMany({
          where: { vehicleId },
          orderBy: { recordedAt: 'asc' },
        }),

        this.prisma.fuelLog.findMany({
          where: { vehicleId },
          orderBy: { date: 'asc' },
        }),

        this.prisma.maintenanceRecord.findMany({
          where: { vehicleId },
          orderBy: { maintenanceDate: 'asc' },
        }),
      ]);

    const totalFuelCostMillimes = fuelLogs.reduce(
      (sum, log) => sum + log.totalCostMillimes,
      0,
    );

    const totalFuelLiters = fuelLogs.reduce(
      (sum, log) => sum + log.liters,
      0,
    );

    const totalPartsCostMillimes = maintenanceRecords.reduce(
      (sum, record) => sum + record.partCostMillimes,
      0,
    );

    const totalLaborCostMillimes = maintenanceRecords.reduce(
      (sum, record) => sum + record.laborCostMillimes,
      0,
    );

    const totalMaintenanceCostMillimes =
      totalPartsCostMillimes + totalLaborCostMillimes;

    const totalOwnershipCostMillimes =
      totalFuelCostMillimes + totalMaintenanceCostMillimes;

    // Build the last six calendar months, including months with no spending.
    const now = new Date();
    const monthlySpending = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - 5 + index,
        1,
      );

      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      const fuelCostMillimes = fuelLogs
        .filter((log) => {
          const date = new Date(log.date);
          return (
            date.getFullYear() === year &&
            date.getMonth() === month
          );
        })
        .reduce((sum, log) => sum + log.totalCostMillimes, 0);

      const maintenanceCostMillimes = maintenanceRecords
        .filter((record) => {
          const date = new Date(record.maintenanceDate);
          return (
            date.getFullYear() === year &&
            date.getMonth() === month
          );
        })
        .reduce(
          (sum, record) =>
            sum +
            record.partCostMillimes +
            record.laborCostMillimes,
          0,
        );

      return {
        month: `${year}-${String(month + 1).padStart(2, '0')}`,
        fuelCostMillimes,
        maintenanceCostMillimes,
        totalCostMillimes:
          fuelCostMillimes + maintenanceCostMillimes,
      };
    });

    return {
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        currentMileage: vehicle.currentMileage,
      },

      mileage: {
        current: vehicle.currentMileage,
        recordsCount: mileageRecords.length,
        history: mileageRecords.map((record) => ({
          id: record.id,
          mileage: record.mileage,
          recordedAt: record.recordedAt,
          note: record.note,
        })),
      },

      fuel: {
        recordsCount: fuelLogs.length,
        totalLiters: Number(totalFuelLiters.toFixed(2)),
        totalCostMillimes: totalFuelCostMillimes,
        history: fuelLogs.map((log) => ({
          id: log.id,
          date: log.date,
          mileage: log.mileage,
          liters: log.liters,
          totalCostMillimes: log.totalCostMillimes,
          fuelType: log.fuelType,
        })),
      },

      maintenance: {
        recordsCount: maintenanceRecords.length,
        partsCostMillimes: totalPartsCostMillimes,
        laborCostMillimes: totalLaborCostMillimes,
        totalCostMillimes: totalMaintenanceCostMillimes,
        history: maintenanceRecords.map((record) => ({
          id: record.id,
          itemName: record.itemName,
          category: record.category,
          maintenanceDate: record.maintenanceDate,
          mileage: record.mileage,
          partCostMillimes: record.partCostMillimes,
          laborCostMillimes: record.laborCostMillimes,
        })),
      },

      ownershipCosts: {
        fuelCostMillimes: totalFuelCostMillimes,
        maintenanceCostMillimes: totalMaintenanceCostMillimes,
        totalCostMillimes: totalOwnershipCostMillimes,
      },

      monthlySpending,
    };
  }
}
