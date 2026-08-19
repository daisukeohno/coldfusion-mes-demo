import { Hantei } from './inspection-judgment.service';

export interface CreateInspectionDto {
  shiji_no?: string;
  lot_no?: string;
  kensa_sha?: string;
  sunpou?: unknown;
  kijun_min?: unknown;
  kijun_max?: unknown;
  furyo_naiyo?: string;
}

export interface CreateInspectionResult {
  kensa_id: number;
  shiji_no: string;
  lot_no: string;
  kensa_ymd: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  hantei: Hantei;
  furyo_naiyo: string;
  message: string;
}

export interface InspectionRow {
  kensa_id: number;
  shiji_no: string;
  lot_no: string;
  kensa_ymd: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  hantei: string;
  furyo_naiyo: string;
  hinmoku_nm: string;
  line_cd: string;
}

export interface DefectSummaryRow {
  furyo_naiyo: string;
  ken: number;
}

export interface ShijiOrderRow {
  shiji_no: string;
  hinmoku_nm: string;
}

export interface InspectionListQuery {
  shiji_no?: string;
  hantei?: string;
}
