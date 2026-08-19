import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProgressService } from './progress.service';
import {
  CreateProgressDto,
  CreateProgressResult,
  ProgressRecordRow,
  ProgressShijiRow,
  SetsubiRow,
} from './progress.dto';

@Controller('api')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Post('progress/records')
  create(@Body() body: CreateProgressDto): Promise<CreateProgressResult> {
    return this.progress.create(body);
  }

  @Get('progress/records')
  findRecentRecords(): Promise<ProgressRecordRow[]> {
    return this.progress.findRecentRecords();
  }

  @Get('progress/shiji-orders')
  findShijiOrders(): Promise<ProgressShijiRow[]> {
    return this.progress.findShijiOrders();
  }

  @Get('progress/setsubi')
  findSetsubi(): Promise<SetsubiRow[]> {
    return this.progress.findSetsubi();
  }

  @Get('progress/kotei-names')
  findKoteiNames(): string[] {
    return this.progress.findKoteiNames();
  }
}
