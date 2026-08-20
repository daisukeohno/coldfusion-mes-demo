/** t_kensa の判定値。API / DB と同じ文字列を使う。 */
export type Hantei = 'OK' | 'NG' | '再検査';

/** 登録リクエスト。プロパティ名は API (snake_case) に合わせる。 */
export interface InspectionRequest {
  shiji_no: string;
  lot_no: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  furyo_naiyo: string;
}

/** 検査履歴 1 行 (現行 qKensa 相当)。 */
export interface KensaResult {
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
  hantei: Hantei;
  furyo_naiyo: string;
}

/** 登録レスポンス。判定はバックエンドのサービス層だけが決める。 */
export interface InspectionResponse {
  hantei: Hantei;
  message: string;
  kensa: KensaResult;
}

/** 不良内容集計 1 行 (現行 qFuryo 相当)。 */
export interface DefectSummary {
  furyo_naiyo: string;
  ken: number;
}

/** 製造指示プルダウン用 (現行 qShijiList 相当)。 */
export interface OrderForInspection {
  shiji_no: string;
  hinmoku_nm: string;
}
