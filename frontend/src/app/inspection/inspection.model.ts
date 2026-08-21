export interface InspectionRecord {
  kensa_id: number;
  shiji_no: string;
  hinmoku_nm: string;
  line_cd: string;
  lot_no: string;
  kensa_ymd: string;
  kensa_sha: string;
  sunpou: number;
  kijun_min: number;
  kijun_max: number;
  hantei: string;
  furyo_naiyo: string;
}

export interface DefectSummary {
  furyo_naiyo: string;
  ken: number;
}

export interface OrderOption {
  shiji_no: string;
  hinmoku_nm: string;
}

export interface InspectionRequest {
  shiji_no: string;
  lot_no: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  furyo_naiyo: string;
}

export interface InspectionResponse {
  ok: boolean;
  message: string;
  hantei: string | null;
  kensa_id: number | null;
}
