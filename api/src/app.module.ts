import { Module } from '@nestjs/common';
import { InspectionModule } from './inspection/inspection.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [InspectionModule, InventoryModule],
})
export class AppModule {}
