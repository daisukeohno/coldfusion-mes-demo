export interface CreateMaintenanceDto {
  setsubi_cd?: string;
  shubetsu?: string;
  teishi_jikan?: unknown;
  /** '1' のときだけ復旧済 (復旧日 = サーバの当日) */
  fukyu?: string;
  naiyo?: string;
  tantou?: string;
}

export interface CreateMaintenanceResult {
  hozen_id: number;
  setsubi_cd: string;
  shubetsu: string;
  hassei_ymd: string;
  fukyu_ymd: string | null;
  teishi_jikan: string;
  naiyo: string;
  tantou: string;
  message: string;
}

/** 設備一覧 / 次回点検予定の 1 行 */
export interface EquipmentPlanRow {
  setsubi_cd: string;
  setsubi_nm: string;
  line_cd: string;
  maker: string;
  dounyu_ymd: string;
  tenken_cycle: number;
  /** 直近の定期点検日。記録がない場合は null */
  last_ymd: string | null;
  next_ymd: string | null;
  keika: number;
  okure: boolean;
  open_ken: number;
  kadou: boolean;
}

/** 保全履歴の 1 行 */
export interface MaintenanceRow {
  hozen_id: number;
  setsubi_cd: string;
  setsubi_nm: string;
  line_cd: string;
  shubetsu: string;
  hassei_ymd: string;
  fukyu_ymd: string | null;
  teishi_jikan: string;
  naiyo: string;
  tantou: string;
  tenken_cycle: number;
}

/** 設備別 停止時間 累計の 1 行 */
export interface DowntimeSummaryRow {
  setsubi_cd: string;
  setsubi_nm: string;
  ken: number;
  jikan: string;
}
