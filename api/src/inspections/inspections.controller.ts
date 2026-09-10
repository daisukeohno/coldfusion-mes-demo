import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { CreateInspectionDto } from './inspection.dto';
import { InspectionsService } from './inspections.service';

@Controller('api/inspections')
export class InspectionsController {
  constructor(private readonly service: InspectionsService) {}

  @Post()
  @HttpCode(201)
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
