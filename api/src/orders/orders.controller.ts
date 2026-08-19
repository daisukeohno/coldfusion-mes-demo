import { Controller, Get, Query } from '@nestjs/common';
import { OrderListResult, OrderSearchOptions } from './orders.dto';
import { OrdersService } from './orders.service';

@Controller('api')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('orders')
  findAll(
    @Query('kw') kw?: string,
    @Query('status') status?: string,
    @Query('line') line?: string,
    @Query('sort') sort?: string,
  ): Promise<OrderListResult> {
    return this.orders.findAll({ kw, status, line, sort });
  }

  @Get('orders/search-options')
  searchOptions(): OrderSearchOptions {
    return this.orders.searchOptions();
  }
}
