/** バックエンドが返す判定値。判定ロジックはフロントに持たず、値の表示のみを行う。 */
export type Hantei = 'OK' | 'NG' | '再検査';

export interface OrderOption {
  shiji_no: string;
  hinmoku_nm: string;
}

export interface InspectionRequest {
  shiji_no: string;
  lot_no: string;
  kensa_sha: string;
  /** 文字列のまま送信し、数値判定はバックエンドに委ねる (旧 isNumeric 相当)。 */
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  furyo_naiyo: string;
}

export interface InspectionRecord {
  kensa_id: number;
  shiji_no: string;
  hinmoku_nm: string;
  line_cd: string | null;
  lot_no: string | null;
  kensa_ymd: string;
  kensa_sha: string | null;
  sunpou: number;
  kijun_min: number;
  kijun_max: number;
  hantei: Hantei;
  furyo_naiyo: string | null;
}

export interface DefectSummary {
  furyo_naiyo: string;
  ken: number;
}

export interface ApiError {
  message: string;
  errors: Record<string, string>;
}
