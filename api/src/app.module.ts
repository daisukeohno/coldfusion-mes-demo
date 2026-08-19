import { Module } from '@nestjs/common';
import { InspectionModule } from './inspection/inspection.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [InspectionModule, ProgressModule],
})
export class AppModule {}
