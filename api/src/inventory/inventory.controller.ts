import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  CreateMovementDto,
  CreateMovementResult,
  InventoryListResult,
  WarehouseSummaryResult,
} from './inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('api')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('inventory/items')
  findAll(@Query('souko') souko?: string): Promise<InventoryListResult> {
    return this.inventory.findAll({ souko });
  }

  @Get('inventory/warehouses')
  warehouseSummary(): Promise<WarehouseSummaryResult> {
    return this.inventory.warehouseSummary();
  }

  @Post('inventory/movements')
  createMovement(@Body() body: CreateMovementDto): Promise<CreateMovementResult> {
    return this.inventory.createMovement(body);
  }
}
