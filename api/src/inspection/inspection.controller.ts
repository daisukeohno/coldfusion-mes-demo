import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { InspectionService } from './inspection.service';

@Controller()
export class InspectionController {
  constructor(private readonly service: InspectionService) {}

  @Post('inspections')
  create(@Body() dto: CreateInspectionDto) {
    return this.service.create(dto);
  }

  @Get('inspections/defect-summary')
  defectSummary() {
    return this.service.defectSummary();
  }

  @Get('inspections')
  findAll(
    @Query('shiji_no') shijiNo?: string,
    @Query('hantei') judgment?: string,
  ) {
    return this.service.findAll(shijiNo, judgment);
  }

  @Get('production-orders')
  productionOrders() {
    return this.service.productionOrders();
  }
}
