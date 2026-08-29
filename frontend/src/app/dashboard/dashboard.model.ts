export interface DashboardKpi {
  total_ken: number;
  total_suryo: number;
  total_kanryo: number;
  total_furyo: number;
  furyo_rate: string;
  okure_ken: number;
}

export interface StatusSummary {
  status: string;
  ken: number;
  suryo: number;
  kanryo: number;
  furyo: number;
  rate: number;
}

export interface LineSummary {
  line_cd: string;
  suryo: number;
  kanryo: number;
  furyo: number;
  zan: number;
}

export interface JudgmentSummary {
  hantei: string;
  ken: number;
}

export interface OverdueOrder {
  shiji_no: string;
  hinmoku_cd: string;
  hinmoku_nm: string;
  line_cd: string;
  suryo: number;
  kanryo_suryo: number;
  noki_ymd: string;
  tokui_nm: string;
}

export interface OpenMaintenance {
  setsubi_cd: string;
  setsubi_nm: string;
  shubetsu: string;
  hassei_ymd: string;
  naiyo: string;
}

export interface ReorderAlert {
  buhin_cd: string;
  buhin_nm: string;
  souko_cd: string;
  zaiko_su: number;
  hacchu_ten: number;
  fusoku: number;
}

export interface Dashboard {
  as_of: string;
  kpi: DashboardKpi;
  status_summary: StatusSummary[];
  line_summary: LineSummary[];
  judgment_summary: JudgmentSummary[];
  overdue_orders: OverdueOrder[];
  open_maintenance: OpenMaintenance[];
  reorder_alerts: ReorderAlert[];
}
