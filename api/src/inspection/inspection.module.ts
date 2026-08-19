import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InspectionController } from './inspection.controller';
import { InspectionJudgmentService } from './inspection-judgment.service';
import { InspectionService } from './inspection.service';

@Module({
  imports: [DatabaseModule],
  controllers: [InspectionController],
  providers: [InspectionService, InspectionJudgmentService],
  exports: [InspectionService, InspectionJudgmentService],
})
export class InspectionModule {}
