import { BadRequestException, Injectable } from '@nestjs/common';
import {
  InspectionJudgmentService,
  InvalidMeasurementError,
} from './inspection-judgment.service.js';
import type {
  CreateInspectionDto,
  CreateInspectionResultDto,
  DefectSummaryDto,
  InspectionDto,
  InspectionFilter,
} from './inspection.dto.js';
import { InspectionsRepository } from './inspections.repository.js';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly judgment: InspectionJudgmentService,
    private readonly repo: InspectionsRepository,
  ) {}

  async register(dto: CreateInspectionDto): Promise<CreateInspectionResultDto> {
    let hantei;
    try {
      hantei = this.judgment.judge(dto);
    } catch (e) {
      if (e instanceof InvalidMeasurementError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
    const kensa_id = await this.repo.insert({
      shiji_no: dto.shiji_no,
      lot_no: dto.lot_no ?? '',
      kensa_sha: dto.kensa_sha ?? '',
      sunpou: this.judgment.toDecimal(dto.sunpou, 'sunpou').toFixed(3),
      kijun_min: this.judgment.toDecimal(dto.kijun_min, 'kijun_min').toFixed(3),
      kijun_max: this.judgment.toDecimal(dto.kijun_max, 'kijun_max').toFixed(3),
      hantei,
      furyo_naiyo: dto.furyo_naiyo ?? '',
    });
    return {
      kensa_id,
      hantei,
      message: `検査結果を登録しました。判定は ${hantei} です。`,
    };
  }

  list(filter: InspectionFilter): Promise<InspectionDto[]> {
    return this.repo.findAll(filter);
  }

  defectSummary(): Promise<DefectSummaryDto[]> {
    return this.repo.defectSummary();
  }
}
