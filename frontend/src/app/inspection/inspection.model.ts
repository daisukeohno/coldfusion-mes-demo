export type Hantei = 'OK' | 'NG' | '再検査';

export interface Inspection {
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

export interface DefectSummary {
  furyo_naiyo: string;
  ken: number;
}

export interface ShijiOrder {
  shiji_no: string;
  hinmoku_nm: string;
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
