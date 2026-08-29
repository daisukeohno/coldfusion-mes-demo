import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OrdersController } from './orders.controller';
import { OrdersJudgmentService } from './orders-judgment.service';
import { OrdersService } from './orders.service';

@Module({
  imports: [DatabaseModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersJudgmentService],
  exports: [OrdersService, OrdersJudgmentService],
})
export class OrdersModule {}
