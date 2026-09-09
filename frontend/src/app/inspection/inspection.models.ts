export type Hantei = 'OK' | 'NG' | '再検査';

export interface OrderOption {
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

export interface CreateInspectionResult {
  kensa_id: number;
  hantei: Hantei;
  message: string;
}

export interface Inspection {
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
  hinmoku_nm: string;
  line_cd: string;
}

export interface DefectSummary {
  furyo_naiyo: string;
  ken: number;
}

export type HanteiFilter = '' | 'NG' | '再検査';
