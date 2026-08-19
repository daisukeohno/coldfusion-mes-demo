import { Controller, Get } from '@nestjs/common';
import { Dashboard } from './dashboard.dto';
import { DashboardService } from './dashboard.service';

@Controller('api')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('dashboard')
  summary(): Promise<Dashboard> {
    return this.dashboard.summary();
  }
}
