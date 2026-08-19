export interface StatusSummaryRow {
  status: string;
  ken: number;
  suryo: number;
  kanryo: number;
  furyo: number;
  /** 進捗率 (%)。CFML の int((kanryo / suryo) * 100) 相当 */
  rate: number;
}

export interface LineSummaryRow {
  line_cd: string;
  suryo: number;
  kanryo: number;
  furyo: number;
  /** 残数 = 指示数 - 完了数 */
  zan: number;
}

export interface OverdueOrderRow {
  shiji_no: string;
  hinmoku_cd: string;
  hinmoku_nm: string;
  line_cd: string;
  suryo: number;
  kanryo_suryo: number;
  noki_ymd: string;
  tokui_nm: string;
}

export interface JudgmentSummaryRow {
  hantei: string;
  ken: number;
}

export interface OpenMaintenanceRow {
  setsubi_cd: string;
  setsubi_nm: string;
  shubetsu: string;
  hassei_ymd: string;
  naiyo: string;
}

export interface ReorderAlertRow {
  buhin_cd: string;
  buhin_nm: string;
  souko_cd: string;
  zaiko_su: number;
  hacchu_ten: number;
  /** 不足 = 発注点 - 在庫数 */
  fusoku: number;
}

export interface DashboardKpi {
  total_ken: number;
  total_suryo: number;
  total_kanryo: number;
  total_furyo: number;
  /** 不良率 (指示数ベース)。numberFormat(x,"9.99") と同じ小数2桁文字列 */
  furyo_rate: string;
  okure_ken: number;
}

export interface Dashboard {
  /** サーバ (DB) 側で取得した基準日 (yyyy-mm-dd) */
  as_of: string;
  kpi: DashboardKpi;
  status_summary: StatusSummaryRow[];
  line_summary: LineSummaryRow[];
  judgment_summary: JudgmentSummaryRow[];
  overdue_orders: OverdueOrderRow[];
  open_maintenance: OpenMaintenanceRow[];
  reorder_alerts: ReorderAlertRow[];
}
