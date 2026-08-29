import { OrderDetailSummary } from './order-detail-summary.service';

export interface OrderDetailHeader {
  shiji_no: string;
  hinmoku_cd: string;
  line_cd: string | null;
  suryo: number;
  kanryo_suryo: number;
  furyo_suryo: number;
  noki_ymd: string | null;
  status: string | null;
  tokui_nm: string | null;
  bikou: string | null;
  toroku_ymd: string | null;
  hinmoku_nm: string;
  kikaku: string | null;
  tani: string | null;
  hyojun_jikan: string | null;
}

export interface OrderDetailProcessRow {
  jisseki_id: number;
  shiji_no: string;
  kotei_no: number;
  kotei_nm: string | null;
  setsubi_cd: string | null;
  sagyousha: string | null;
  kaishi_dt: string | null;
  shuryo_dt: string | null;
  yoryo_suryo: number | null;
  furyo_suryo: number | null;
  setsubi_nm: string | null;
}

export interface OrderDetailInspectionRow {
  kensa_id: number;
  shiji_no: string;
  lot_no: string | null;
  kensa_ymd: string | null;
  kensa_sha: string | null;
  sunpou: string | null;
  kijun_min: string | null;
  kijun_max: string | null;
  hantei: string | null;
  furyo_naiyo: string | null;
}

export interface OrderDetailResult {
  shiji: OrderDetailHeader;
  summary: OrderDetailSummary;
  kotei: OrderDetailProcessRow[];
  kensa: OrderDetailInspectionRow[];
}
