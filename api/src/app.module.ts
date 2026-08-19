import { Module } from '@nestjs/common';
import { InspectionModule } from './inspection/inspection.module';
import { MaintenanceModule } from './maintenance/maintenance.module';

@Module({
  imports: [InspectionModule, MaintenanceModule],
})
export class AppModule {}
