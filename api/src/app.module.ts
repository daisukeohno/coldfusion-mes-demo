import { Module } from '@nestjs/common';
import { InspectionModule } from './inspection/inspection.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [InspectionModule, OrdersModule],
})
export class AppModule {}
