import { Module } from '@nestjs/common';
import { InspectionModule } from './inspection/inspection.module';

@Module({
  imports: [InspectionModule],
})
export class AppModule {}
