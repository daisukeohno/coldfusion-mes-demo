import {
  KoteiMetrics,
  LineMetrics,
  OkureMetrics,
  SagyoushaMetrics,
} from './report-metrics.service';

export interface DailyReportQuery {
  ymd?: string;
}

export interface DailyReport {
  /** 出力日 (サーバ側 = DB の curdate() で取得。クライアント時刻は使わない) */
  output_ymd: string;
  /** 画面の「対象日」入力値。report.cfm と同じく集計の絞込には使われない */
  ymd: string;
  /** 対象日による絞込が有効かどうか (report.cfm では未実装のため常に false) */
  ymd_filter_applied: boolean;
  lines: LineMetrics[];
  kotei: KoteiMetrics[];
  sagyousha: SagyoushaMetrics[];
  okure: OkureMetrics[];
}
