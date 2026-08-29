import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ReportMetricsService } from './report-metrics.service';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportController],
  providers: [ReportService, ReportMetricsService],
  exports: [ReportService, ReportMetricsService],
})
export class ReportModule {}
