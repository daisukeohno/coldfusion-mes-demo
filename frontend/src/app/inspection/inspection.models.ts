export type Hantei = 'OK' | 'NG' | '再検査';

export interface ShijiOption {
  shiji_no: string;
  hinmoku_nm: string;
}

export interface Inspection {
  kensa_id: number;
  shiji_no: string;
  hinmoku_nm: string;
  line_cd: string | null;
  lot_no: string | null;
  kensa_ymd: string | null;
  kensa_sha: string | null;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  hantei: string;
  furyo_naiyo: string | null;
}

export interface DefectSummary {
  furyo_naiyo: string;
  ken: number;
}

export interface CreateInspectionRequest {
  shiji_no: string;
  lot_no: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  furyo_naiyo: string;
}

export interface CreateInspectionResponse {
  kensa_id: number;
  hantei: Hantei;
  message: string;
}

export interface InspectionFilter {
  shiji_no?: string;
  hantei?: string;
}
