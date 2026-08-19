import { Module } from '@nestjs/common';
import { InspectionModule } from './inspection/inspection.module';
import { OrderDetailModule } from './order-detail/order-detail.module';

@Module({
  imports: [InspectionModule, OrderDetailModule],
})
export class AppModule {}
