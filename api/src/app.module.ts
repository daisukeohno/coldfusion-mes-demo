import { Module } from '@nestjs/common';
import { InspectionController } from './inspection/inspection.controller';
import { InspectionJudgmentService } from './inspection/inspection-judgment.service';
import { InspectionRepository } from './inspection/inspection.repository';
import { InspectionService } from './inspection/inspection.service';

@Module({
  controllers: [InspectionController],
  providers: [
    InspectionJudgmentService,
    InspectionRepository,
    InspectionService,
  ],
})
export class AppModule {}
