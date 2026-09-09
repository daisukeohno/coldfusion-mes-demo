import { Module } from '@nestjs/common';
import { InspectionJudgmentService } from './inspection-judgment.service.js';
import { InspectionsController } from './inspections.controller.js';
import {
  InspectionsRepository,
  MysqlInspectionsRepository,
} from './inspections.repository.js';
import { InspectionsService } from './inspections.service.js';

@Module({
  controllers: [InspectionsController],
  providers: [
    InspectionJudgmentService,
    InspectionsService,
    { provide: InspectionsRepository, useClass: MysqlInspectionsRepository },
  ],
})
export class InspectionsModule {}
