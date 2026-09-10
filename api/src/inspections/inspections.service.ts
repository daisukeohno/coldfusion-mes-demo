import { BadRequestException, Injectable } from '@nestjs/common';
import { InspectionJudgmentService } from './inspection-judgment.service';
import {
  CreateInspectionDto,
  CreateInspectionResponse,
  DefectSummaryRow,
  InspectionRow,
} from './inspection.dto';
import {
  InspectionFilter,
  InspectionsRepository,
} from './inspections.repository';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly judgment: InspectionJudgmentService,
    private readonly repo: InspectionsRepository,
  ) {}

  async register(dto: CreateInspectionDto): Promise<CreateInspectionResponse> {
    const result = this.judgment.judge(
      dto.sunpou as string,
      dto.kijun_min as string,
      dto.kijun_max as string,
    );
    if (!result.valid) {
      throw new BadRequestException(result.message);
    }
    const kensa_id = await this.repo.insert({
      shiji_no: dto.shiji_no,
      lot_no: dto.lot_no ?? '',
      kensa_sha: dto.kensa_sha ?? '',
      sunpou: String(dto.sunpou).trim(),
      kijun_min: String(dto.kijun_min).trim(),
      kijun_max: String(dto.kijun_max).trim(),
      hantei: result.hantei,
      furyo_naiyo: dto.furyo_naiyo ?? '',
    });
    return {
      kensa_id,
      hantei: result.hantei,
      message: `検査結果を登録しました。判定は ${result.hantei} です。`,
    };
  }

  list(filter: InspectionFilter): Promise<InspectionRow[]> {
    return this.repo.find(filter);
  }

  defectSummary(): Promise<DefectSummaryRow[]> {
    return this.repo.defectSummary();
  }
}
