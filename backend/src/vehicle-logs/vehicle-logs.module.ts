import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VehicleLogsController } from './vehicle-logs.controller';
import { VehicleLogsService } from './vehicle-logs.service';

@Module({
  imports: [PrismaModule],
  controllers: [VehicleLogsController],
  providers: [VehicleLogsService],
})
export class VehicleLogsModule {}
