import { Controller, Get } from '@nestjs/common';
import { OrdersService } from './orders.service.js';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  list() {
    return this.service.list();
  }
}
