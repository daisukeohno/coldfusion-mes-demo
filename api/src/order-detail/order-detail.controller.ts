import { Controller, Get, Param } from '@nestjs/common';
import { OrderDetailResult } from './order-detail.dto';
import { OrderDetailService } from './order-detail.service';

@Controller('api')
export class OrderDetailController {
  constructor(private readonly orderDetail: OrderDetailService) {}

  @Get('order-detail/:shijiNo')
  findOne(@Param('shijiNo') shijiNo: string): Promise<OrderDetailResult> {
    return this.orderDetail.findOne(shijiNo);
  }
}
