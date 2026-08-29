import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceJudgmentService } from './maintenance-judgment.service';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceJudgmentService],
  exports: [MaintenanceService, MaintenanceJudgmentService],
})
export class MaintenanceModule {}
