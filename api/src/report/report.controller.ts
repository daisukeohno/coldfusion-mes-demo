import { Controller, Get, Query } from '@nestjs/common';
import { DailyReport } from './report.dto';
import { ReportService } from './report.service';

@Controller('api')
export class ReportController {
  constructor(private readonly report: ReportService) {}

  @Get('report/daily')
  dailyReport(@Query('ymd') ymd?: string): Promise<DailyReport> {
    return this.report.dailyReport({ ymd });
  }
}
