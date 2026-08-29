export interface ReportLine {
  line_cd: string;
  ken: number;
  suryo: number;
  kanryo: number;
  furyo: number;
  furyo_rate: string;
  furyo_rate_ng: boolean;
  tassei_rate: string;
}

export interface ReportKotei {
  kotei_nm: string;
  ken: number;
  yoryo: number;
  furyo: number;
}

export interface ReportSagyousha {
  sagyousha: string;
  ken: number;
  yoryo: number;
  furyo: number;
}

export interface ReportOkure {
  shiji_no: string;
  hinmoku_nm: string;
  noki_ymd: string;
  suryo: number;
  kanryo_suryo: number;
  zansu: number;
  tokui_nm: string;
}

export interface DailyReport {
  output_ymd: string;
  ymd: string;
  ymd_filter_applied: boolean;
  lines: ReportLine[];
  kotei: ReportKotei[];
  sagyousha: ReportSagyousha[];
  okure: ReportOkure[];
}
