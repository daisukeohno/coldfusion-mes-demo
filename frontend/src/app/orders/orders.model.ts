export interface Order {
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
  okure: boolean;
  rate: number;
}

export interface OrderListResponse {
  rows: Order[];
  recordCount: number;
  today: string;
  sort: string;
}

export interface OrderSearchOptions {
  statusList: string[];
  lineList: string[];
}

export interface OrderFilter {
  kw: string;
  status: string;
  line: string;
  sort: string;
}
