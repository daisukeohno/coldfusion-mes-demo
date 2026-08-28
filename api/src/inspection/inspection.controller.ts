import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InspectionService } from './inspection.service';
import {
  CreateInspectionDto,
  CreateInspectionResult,
  DefectSummaryRow,
  InspectionRow,
  ShijiOrderRow,
} from './inspection.dto';

@Controller('api')
export class InspectionController {
  constructor(private readonly inspection: InspectionService) {}

  @Post('inspections')
  create(@Body() body: CreateInspectionDto): Promise<CreateInspectionResult> {
    return this.inspection.create(body);
  }

  @Get('inspections')
  findAll(
    @Query('shiji_no') shijiNo?: string,
    @Query('hantei') hantei?: string,
  ): Promise<InspectionRow[]> {
    return this.inspection.findAll({ shiji_no: shijiNo, hantei });
  }

  @Get('inspections/defect-summary')
  defectSummary(): Promise<DefectSummaryRow[]> {
    return this.inspection.defectSummary();
  }

  @Get('shiji-orders')
  findShijiOrders(): Promise<ShijiOrderRow[]> {
    return this.inspection.findShijiOrders();
  }
}
