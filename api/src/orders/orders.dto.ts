export interface OrderListQuery {
  kw?: string;
  status?: string;
  line?: string;
  sort?: string;
}

export interface OrderRow {
  shiji_no: string;
  hinmoku_cd: string;
  hinmoku_nm: string;
  line_cd: string;
  suryo: number;
  kanryo_suryo: number;
  furyo_suryo: number;
  noki_ymd: string;
  status: string;
  tokui_nm: string;
  bikou: string;
}

export interface OrderListRow extends OrderRow {
  /** 納期遅れ (app/orders.cfm の okure) */
  okure: boolean;
  /** 進捗率 % (app/orders.cfm の rate) */
  rate: number;
}

export interface OrderListResult {
  rows: OrderListRow[];
  /** qList.recordCount 相当 */
  recordCount: number;
  /** 判定に使ったサーバ側の日付 (YYYY-MM-DD) */
  today: string;
  /** 実際に適用された並び順 */
  sort: string;
}

export interface OrderSearchOptions {
  statusList: string[];
  lineList: string[];
}
