import { Module } from '@nestjs/common';
import { InspectionJudgmentService } from './inspection-judgment.service';
import { InspectionsController } from './inspections.controller';
import {
  InspectionsRepository,
  MysqlInspectionsRepository,
} from './inspections.repository';
import { InspectionsService } from './inspections.service';

@Module({
  controllers: [InspectionsController],
  providers: [
    InspectionJudgmentService,
    InspectionsService,
    { provide: InspectionsRepository, useClass: MysqlInspectionsRepository },
  ],
})
export class InspectionsModule {}
