import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { InspectionModule } from './inspection/inspection.module';

@Module({
  imports: [DashboardModule, InspectionModule],
})
export class AppModule {}
