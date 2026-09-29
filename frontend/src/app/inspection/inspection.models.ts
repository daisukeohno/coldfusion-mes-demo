export type Hantei = 'OK' | 'NG' | '再検査';

export interface InspectionRequest {
  shiji_no: string;
  lot_no: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  furyo_naiyo: string;
}

export interface InspectionCreatedResponse {
  kensa_id: number;
  hantei: Hantei;
  message: string;
}

export interface InspectionRecord {
  kensa_id: number;
  shiji_no: string;
  hinmoku_nm: string;
  line_cd: string | null;
  lot_no: string | null;
  kensa_ymd: string | null;
  kensa_sha: string | null;
  sunpou: number | null;
  kijun_min: number | null;
  kijun_max: number | null;
  hantei: string | null;
  furyo_naiyo: string | null;
}

export interface DefectSummary {
  furyo_naiyo: string;
  ken: number;
}

export interface ProductionOrderOption {
  shiji_no: string;
  hinmoku_nm: string;
}

export interface ApiError {
  field: string | null;
  message: string;
}

export interface InspectionFilter {
  shijiNo: string;
  hantei: string;
}
