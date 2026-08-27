import { Injectable } from '@nestjs/common';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import {
  DefectSummaryRow,
  InspectionRepository,
  InspectionRow,
  ProductionOrderRow,
} from './inspection.repository';
import { InspectionJudgmentService } from './inspection-judgment.service';

@Injectable()
export class InspectionService {
  constructor(
    private readonly repository: InspectionRepository,
    private readonly judgmentService: InspectionJudgmentService,
  ) {}

  create(dto: CreateInspectionDto): Promise<InspectionRow> {
    const judgment = this.judgmentService.judge(
      dto.sunpou,
      dto.kijun_min,
      dto.kijun_max,
    );
    return this.repository.create(dto, judgment);
  }

  findAll(shijiNo?: string, judgment?: string): Promise<InspectionRow[]> {
    return this.repository.findAll(shijiNo, judgment);
  }

  defectSummary(): Promise<DefectSummaryRow[]> {
    return this.repository.defectSummary();
  }

  productionOrders(): Promise<ProductionOrderRow[]> {
    return this.repository.productionOrders();
  }
}
