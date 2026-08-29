import { BadRequestException, Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import {
  JissekiAggregate,
  LineAggregate,
  OkureAggregate,
  ReportMetricsService,
} from './report-metrics.service';
import { DailyReport, DailyReportQuery } from './report.dto';

/** ライン別 生産集計。report.cfm の qLine と同じ集計条件・並び順 (status での絞込はしない) */
const LINE_SQL = `select s.line_cd
    , count(*) as ken
    , sum(s.suryo) as suryo
    , sum(s.kanryo_suryo) as kanryo
    , sum(s.furyo_suryo) as furyo
  from t_seizou_shiji s
  group by s.line_cd
  order by s.line_cd`;

/** 工程別 実績。report.cfm の qKotei */
const KOTEI_SQL = `select j.kotei_nm, count(*) as ken, sum(j.yoryo_suryo) as yoryo, sum(j.furyo_suryo) as furyo
  from t_kotei_jisseki j
  group by j.kotei_nm
  order by j.kotei_nm`;

/** 作業者別 実績。report.cfm の qSagyou (良品数の降順) */
const SAGYOUSHA_SQL = `select j.sagyousha, count(*) as ken, sum(j.yoryo_suryo) as yoryo, sum(j.furyo_suryo) as furyo
  from t_kotei_jisseki j
  group by j.sagyousha
  order by yoryo desc`;

/**
 * 納期遅れ 明細。report.cfm の qOkure。
 * 判定条件 (status <> '完了' かつ noki_ymd < curdate() の厳密不等号) と並び順はそのまま保持し、
 * 暗黙結合のみ明示 join に書き換えている。
 */
const OKURE_SQL = `select s.shiji_no, h.hinmoku_nm, s.noki_ymd, s.suryo, s.kanryo_suryo, s.tokui_nm
  from t_seizou_shiji s
  join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
  where s.status <> '完了' and s.noki_ymd < curdate()
  order by s.noki_ymd`;

/** 出力日はサーバ側 (DB) の日付を使う。納期遅れ判定の curdate() と基準日を揃える */
const TODAY_SQL = `select date_format(curdate(), '%Y-%m-%d') as output_ymd`;

/** 「対象日」入力欄の最大長。DB へは渡らないが無制限の文字列は受け付けない */
const YMD_MAX_LENGTH = 10;

@Injectable()
export class ReportService {
  constructor(
    private readonly db: DatabaseService,
    private readonly metrics: ReportMetricsService,
  ) {}

  /** 生産日報。参照のみで DB を更新しない */
  async dailyReport(query: DailyReportQuery): Promise<DailyReport> {
    const ymd = this.validateYmd(query.ymd);

    const [today] = await this.db.query<{ output_ymd: string } & RowDataPacket>(TODAY_SQL);
    const outputYmd = today?.output_ymd ?? '';

    const [lineRows, koteiRows, sagyoushaRows, okureRows] = await Promise.all([
      this.db.query<LineAggregate & RowDataPacket>(LINE_SQL),
      this.db.query<(JissekiAggregate & { kotei_nm: string }) & RowDataPacket>(KOTEI_SQL),
      this.db.query<(JissekiAggregate & { sagyousha: string }) & RowDataPacket>(SAGYOUSHA_SQL),
      this.db.query<OkureAggregate & RowDataPacket>(OKURE_SQL),
    ]);

    return {
      output_ymd: outputYmd,
      // 対象日が未指定の場合は report.cfm と同じくサーバ日付を初期値にする
      ymd: ymd === '' ? outputYmd : ymd,
      ymd_filter_applied: false,
      lines: lineRows.map((row) => this.metrics.lineRow(row)),
      kotei: koteiRows.map((row) => this.metrics.koteiRow(row)),
      sagyousha: sagyoushaRows.map((row) => this.metrics.sagyoushaRow(row)),
      okure: okureRows.map((row) => this.metrics.okureRow(row)),
    };
  }

  /**
   * 対象日の入力チェック。report.cfm では絞込が未実装で任意文字列を受け付けるため
   * 書式は検証せず、型と長さのみ検証する (集計 SQL には渡さない)。
   */
  private validateYmd(value: string | undefined): string {
    if (value === undefined || value === null) {
      return '';
    }
    if (typeof value !== 'string') {
      throw new BadRequestException('対象日は文字列で入力してください。');
    }
    if (value.length > YMD_MAX_LENGTH) {
      throw new BadRequestException(`対象日は ${YMD_MAX_LENGTH} 文字以内で入力してください。`);
    }
    return value;
  }
}
