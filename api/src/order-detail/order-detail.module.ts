import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OrderDetailController } from './order-detail.controller';
import { OrderDetailService } from './order-detail.service';
import { OrderDetailSummaryService } from './order-detail-summary.service';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderDetailController],
  providers: [OrderDetailService, OrderDetailSummaryService],
})
export class OrderDetailModule {}
