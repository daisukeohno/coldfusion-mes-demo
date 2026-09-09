import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module.js';
import { InspectionsModule } from './inspections/inspections.module.js';
import { OrdersModule } from './orders/orders.module.js';

@Module({
  imports: [DbModule, InspectionsModule, OrdersModule],
})
export class AppModule {}
