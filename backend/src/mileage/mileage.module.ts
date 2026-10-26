import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MileageController } from './mileage.controller';
import { MileageService } from './mileage.service';

@Module({
  imports: [PrismaModule],
  controllers: [MileageController],
  providers: [MileageService],
})
export class MileageModule {}
