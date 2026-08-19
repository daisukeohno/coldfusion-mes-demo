import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import { DashboardMetricsService, toCount } from './dashboard-metrics.service';
import {
  Dashboard,
  JudgmentSummaryRow,
  LineSummaryRow,
  OpenMaintenanceRow,
  OverdueOrderRow,
  ReorderAlertRow,
  StatusSummaryRow,
} from './dashboard.dto';

/** 基準日。納期遅れ判定と同じ DB サーバの日付を使う */
const TODAY_SQL = `select date_format(curdate(), '%Y-%m-%d') as today`;

const STATUS_SUMMARY_SQL = `select status, count(*) as ken, sum(suryo) as suryo,
    sum(kanryo_suryo) as kanryo, sum(furyo_suryo) as furyo
  from t_seizou_shiji
  group by status
  order by status`;

const LINE_SUMMARY_SQL = `select line_cd, sum(suryo) as suryo, sum(kanryo_suryo) as kanryo,
    sum(furyo_suryo) as furyo
  from t_seizou_shiji
  where status <> '完了'
  group by line_cd
  order by line_cd`;

/**
 * 納期遅れ = 未完了 かつ 納期 < 当日 (厳密不等号。当日納期は遅れではない)。
 * index.cfm / orders.cfm / report.cfm に同じ条件がコピーされている。
 */
const OVERDUE_SQL = `select s.shiji_no, s.hinmoku_cd, h.hinmoku_nm, s.line_cd, s.suryo,
    s.kanryo_suryo, date_format(s.noki_ymd, '%Y-%m-%d') as noki_ymd, s.tokui_nm
  from t_seizou_shiji s
  join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd
  where s.status <> '完了'
    and s.noki_ymd < curdate()
  order by s.noki_ymd`;

const JUDGMENT_SUMMARY_SQL = `select hantei, count(*) as ken from t_kensa group by hantei`;

const OPEN_MAINTENANCE_SQL = `select z.setsubi_cd, m.setsubi_nm, z.shubetsu,
    date_format(z.hassei_ymd, '%Y-%m-%d') as hassei_ymd, z.naiyo
  from t_hozen z
  join m_setsubi m on z.setsubi_cd = m.setsubi_cd
  where z.fukyu_ymd is null
  order by z.hassei_ymd`;

const REORDER_ALERT_SQL = `select buhin_cd, buhin_nm, souko_cd, zaiko_su, hacchu_ten
  from t_zaiko
  where zaiko_su < hacchu_ten
  order by (zaiko_su - hacchu_ten)`;

interface RawStatusRow extends RowDataPacket {
  status: string;
  ken: unknown;
  suryo: unknown;
  kanryo: unknown;
  furyo: unknown;
}

interface RawLineRow extends RowDataPacket {
  line_cd: string;
  suryo: unknown;
  kanryo: unknown;
  furyo: unknown;
}

interface RawOverdueRow extends RowDataPacket {
  shiji_no: string;
  hinmoku_cd: string;
  hinmoku_nm: string;
  line_cd: string;
  suryo: unknown;
  kanryo_suryo: unknown;
  noki_ymd: string;
  tokui_nm: string;
}

interface RawJudgmentRow extends RowDataPacket {
  hantei: string;
  ken: unknown;
}

interface RawZaikoRow extends RowDataPacket {
  buhin_cd: string;
  buhin_nm: string;
  souko_cd: string;
  zaiko_su: unknown;
  hacchu_ten: unknown;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly db: DatabaseService,
    private readonly metrics: DashboardMetricsService,
  ) {}

  /** app/index.cfm の 6 本のクエリと画面側の集計をまとめて返す (読み取り専用) */
  async summary(): Promise<Dashboard> {
    const [todayRows, statusRaw, lineRaw, overdueRaw, judgmentRaw, maintenanceRows, zaikoRaw] =
      await Promise.all([
        this.db.query<RowDataPacket & { today: string }>(TODAY_SQL),
        this.db.query<RawStatusRow>(STATUS_SUMMARY_SQL),
        this.db.query<RawLineRow>(LINE_SUMMARY_SQL),
        this.db.query<RawOverdueRow>(OVERDUE_SQL),
        this.db.query<RawJudgmentRow>(JUDGMENT_SUMMARY_SQL),
        this.db.query<RowDataPacket & OpenMaintenanceRow>(OPEN_MAINTENANCE_SQL),
        this.db.query<RawZaikoRow>(REORDER_ALERT_SQL),
      ]);

    const statusSummary: StatusSummaryRow[] = statusRaw.map((row) => {
      const suryo = toCount(row.suryo);
      const kanryo = toCount(row.kanryo);
      return {
        status: row.status,
        ken: toCount(row.ken),
        suryo,
        kanryo,
        furyo: toCount(row.furyo),
        rate: this.metrics.progressRate(kanryo, suryo),
      };
    });

    const lineSummary: LineSummaryRow[] = lineRaw.map((row) => {
      const suryo = toCount(row.suryo);
      const kanryo = toCount(row.kanryo);
      return {
        line_cd: row.line_cd,
        suryo,
        kanryo,
        furyo: toCount(row.furyo),
        zan: suryo - kanryo,
      };
    });

    const overdueOrders: OverdueOrderRow[] = overdueRaw.map((row) => ({
      shiji_no: row.shiji_no,
      hinmoku_cd: row.hinmoku_cd,
      hinmoku_nm: row.hinmoku_nm,
      line_cd: row.line_cd,
      suryo: toCount(row.suryo),
      kanryo_suryo: toCount(row.kanryo_suryo),
      noki_ymd: row.noki_ymd,
      tokui_nm: row.tokui_nm,
    }));

    const judgmentSummary: JudgmentSummaryRow[] = judgmentRaw.map((row) => ({
      hantei: row.hantei,
      ken: toCount(row.ken),
    }));

    const reorderAlerts: ReorderAlertRow[] = zaikoRaw.map((row) => {
      const zaikoSu = toCount(row.zaiko_su);
      const hacchuTen = toCount(row.hacchu_ten);
      return {
        buhin_cd: row.buhin_cd,
        buhin_nm: row.buhin_nm,
        souko_cd: row.souko_cd,
        zaiko_su: zaikoSu,
        hacchu_ten: hacchuTen,
        fusoku: hacchuTen - zaikoSu,
      };
    });

    const totals = this.metrics.totals(statusSummary);

    return {
      as_of: todayRows[0]?.today ?? '',
      kpi: {
        ...totals,
        furyo_rate: this.metrics.furyoRate(totals.total_furyo, totals.total_suryo),
        okure_ken: overdueOrders.length,
      },
      status_summary: statusSummary,
      line_summary: lineSummary,
      judgment_summary: judgmentSummary,
      overdue_orders: overdueOrders,
      open_maintenance: maintenanceRows.map((row) => ({
        setsubi_cd: row.setsubi_cd,
        setsubi_nm: row.setsubi_nm,
        shubetsu: row.shubetsu,
        hassei_ymd: row.hassei_ymd,
        naiyo: row.naiyo,
      })),
      reorder_alerts: reorderAlerts,
    };
  }
}
