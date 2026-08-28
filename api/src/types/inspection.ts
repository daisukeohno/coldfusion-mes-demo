import type { InspectionJudgment } from '../services/inspectionJudgment';

export interface CreateInspectionInput {
  shiji_no: string;
  lot_no: string;
  kensa_sha: string;
  sunpou: string | number;
  kijun_min: string | number;
  kijun_max: string | number;
  furyo_naiyo: string;
}

export interface InspectionInsert extends CreateInspectionInput {
  hantei: InspectionJudgment;
}

export interface InspectionRecord {
  kensa_id: number;
  shiji_no: string;
  hinmoku_nm: string;
  line_cd: string | null;
  lot_no: string | null;
  kensa_ymd: string | null;
  kensa_sha: string | null;
  sunpou: string | null;
  kijun_min: string | null;
  kijun_max: string | null;
  hantei: InspectionJudgment;
  furyo_naiyo: string | null;
}

export interface DefectSummary {
  furyo_naiyo: string;
  ken: number;
}

export interface OrderOption {
  shiji_no: string;
  hinmoku_nm: string;
}
