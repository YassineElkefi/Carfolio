import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { RepairRecommendationsController } from './repair-recommendations.controller';
import { RepairRecommendationsService } from './repair-recommendations.service';

@Module({
  imports: [PrismaModule],
  controllers: [MaintenanceController, RepairRecommendationsController],
  providers: [MaintenanceService, RepairRecommendationsService],
})
export class MaintenanceModule {}