import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import type { CreateInspectionDto } from './inspection.dto.js';
import { InspectionsService } from './inspections.service.js';

@Controller('api/inspections')
export class InspectionsController {
  constructor(private readonly service: InspectionsService) {}

  @Post()
  create(@Body() dto: CreateInspectionDto) {
    return this.service.register(dto);
  }

  @Get()
  list(@Query('shiji_no') shiji_no?: string, @Query('hantei') hantei?: string) {
    return this.service.list({ shiji_no, hantei });
  }

  @Get('defect-summary')
  defectSummary() {
    return this.service.defectSummary();
  }
}
