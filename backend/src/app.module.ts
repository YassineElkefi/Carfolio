import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { MileageModule } from './mileage/mileage.module';
import { FuelModule } from './fuel/fuel.module';
import { MaintenanceModule } from './maintenance/maintenance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    VehiclesModule,
    MileageModule,
    FuelModule,
    MaintenanceModule,
  ],
})
export class AppModule {}
