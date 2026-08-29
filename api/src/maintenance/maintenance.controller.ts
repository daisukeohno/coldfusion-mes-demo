import { Body, Controller, Get, Post } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import {
  CreateMaintenanceDto,
  CreateMaintenanceResult,
  DowntimeSummaryRow,
  EquipmentPlanRow,
  MaintenanceRow,
} from './maintenance.dto';

@Controller('api')
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Post('maintenances')
  create(@Body() body: CreateMaintenanceDto): Promise<CreateMaintenanceResult> {
    return this.maintenance.create(body);
  }

  @Get('maintenances')
  findAll(): Promise<MaintenanceRow[]> {
    return this.maintenance.findAll();
  }

  @Get('maintenances/downtime-summary')
  downtimeSummary(): Promise<DowntimeSummaryRow[]> {
    return this.maintenance.downtimeSummary();
  }

  @Get('equipment-plans')
  findEquipmentPlans(): Promise<EquipmentPlanRow[]> {
    return this.maintenance.findEquipmentPlans();
  }
}
