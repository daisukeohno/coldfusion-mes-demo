import { Module } from '@nestjs/common';
import { InspectionModule } from './inspection/inspection.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [InspectionModule, ReportModule],
})
export class AppModule {}
