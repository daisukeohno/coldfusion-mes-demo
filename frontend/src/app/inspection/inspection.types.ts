export type InspectionJudgment = 'OK' | 'NG' | '再検査';

export interface ProductionOrder {
  shiji_no: string;
  hinmoku_nm: string;
}

export interface InspectionRecord {
  kensa_id: number;
  shiji_no: string;
  lot_no: string;
  kensa_ymd: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  hantei: InspectionJudgment;
  furyo_naiyo: string;
  hinmoku_nm: string;
  line_cd: string;
}

export interface DefectSummary {
  furyo_naiyo: string;
  ken: number;
}

export interface CreateInspection {
  shiji_no: string;
  lot_no: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  furyo_naiyo: string;
}
