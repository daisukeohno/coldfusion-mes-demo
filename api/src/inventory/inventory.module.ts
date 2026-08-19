import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InventoryController } from './inventory.controller';
import { InventoryJudgmentService } from './inventory-judgment.service';
import { InventoryService } from './inventory.service';

@Module({
  imports: [DatabaseModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryJudgmentService],
  exports: [InventoryService, InventoryJudgmentService],
})
export class InventoryModule {}
