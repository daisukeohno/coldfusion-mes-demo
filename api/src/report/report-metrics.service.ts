import { Injectable } from '@nestjs/common';

/** 不良率が赤字 (class="ng") になる閾値 (%)。report.cfm の `fRate GTE 3` */
export const FURYO_RATE_NG_PERCENT = 3;

/**
 * 集計列 (INT / sum()) を整数へ変換する。
 * MySQL の sum() は対象行がすべて NULL の場合 NULL を返すため 0 として扱う。
 */
export function toInt(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }
  const trimmed = String(value).trim();
  if (!/^[+-]?\d+(\.\d+)$|^[+-]?\d+$/.test(trimmed)) {
    return 0;
  }
  return Math.trunc(Number(trimmed));
}

/**
 * bunshi / bunbo * 100 を小数 `scale` 桁へ四捨五入した十進文字列にする。
 * 倍精度演算を経由せず整数演算で丸めるため、浮動小数点誤差で表示が変わらない。
 * bunbo が 0 以下の場合は CFML と同じく 0 を返す。
 */
export function percentString(bunshi: number, bunbo: number, scale: number): string {
  if (bunbo <= 0) {
    return (0).toFixed(scale);
  }
  const factor = 10 ** scale;
  const sign = bunshi < 0 ? -1 : 1;
  const scaled = Math.round((Math.abs(bunshi) * 100 * factor) / bunbo) * sign;
  const abs = Math.abs(scaled);
  const intPart = Math.trunc(abs / factor);
  const frac = String(abs - intPart * factor).padStart(scale, '0');
  const body = scale > 0 ? `${intPart}.${frac}` : String(intPart);
  return scaled < 0 ? `-${body}` : body;
}

/**
 * 不良率が閾値以上かを整数比較で判定する。
 * furyo / kanryo * 100 GTE 3 を furyo * 100 GTE kanryo * 3 として評価する。
 */
export function isFuryoRateNg(furyo: number, kanryo: number): boolean {
  if (kanryo <= 0) {
    // 完了数が 0 のときは不良率 0 扱い (report.cfm の三項演算子と同じ)
    return false;
  }
  return furyo * 100 >= kanryo * FURYO_RATE_NG_PERCENT;
}

export interface LineAggregate {
  line_cd: string;
  ken: unknown;
  suryo: unknown;
  kanryo: unknown;
  furyo: unknown;
}

export interface LineMetrics {
  line_cd: string;
  ken: number;
  suryo: number;
  kanryo: number;
  furyo: number;
  /** 不良率 (完了数ベース)。report.cfm では指示数ベースのダッシュボードと異なる */
  furyo_rate: string;
  furyo_rate_ng: boolean;
  /** 達成率 (完了数 / 指示数) */
  tassei_rate: string;
}

export interface JissekiAggregate {
  ken: unknown;
  yoryo: unknown;
  furyo: unknown;
}

export interface KoteiMetrics {
  kotei_nm: string;
  ken: number;
  yoryo: number;
  furyo: number;
}

export interface SagyoushaMetrics {
  sagyousha: string;
  ken: number;
  yoryo: number;
  furyo: number;
}

export interface OkureAggregate {
  shiji_no: string;
  hinmoku_nm: string;
  noki_ymd: string;
  suryo: unknown;
  kanryo_suryo: unknown;
  tokui_nm: string;
}

export interface OkureMetrics {
  shiji_no: string;
  hinmoku_nm: string;
  noki_ymd: string;
  suryo: number;
  kanryo_suryo: number;
  /** 残数 = 指示数 - 完了数 (完了数が指示数を超える場合は負値のまま表示する) */
  zansu: number;
  tokui_nm: string;
}

/** 生産日報の集計・判定ロジック。HTTP / DB に依存しない */
@Injectable()
export class ReportMetricsService {
  /** ライン別 生産集計の 1 行 */
  lineRow(row: LineAggregate): LineMetrics {
    const ken = toInt(row.ken);
    const suryo = toInt(row.suryo);
    const kanryo = toInt(row.kanryo);
    const furyo = toInt(row.furyo);
    return {
      line_cd: row.line_cd,
      ken,
      suryo,
      kanryo,
      furyo,
      furyo_rate: percentString(furyo, kanryo, 2),
      furyo_rate_ng: isFuryoRateNg(furyo, kanryo),
      tassei_rate: percentString(kanryo, suryo, 1),
    };
  }

  /** 工程別 実績の 1 行 */
  koteiRow(row: JissekiAggregate & { kotei_nm: string }): KoteiMetrics {
    return {
      kotei_nm: row.kotei_nm,
      ken: toInt(row.ken),
      yoryo: toInt(row.yoryo),
      furyo: toInt(row.furyo),
    };
  }

  /** 作業者別 実績の 1 行 */
  sagyoushaRow(row: JissekiAggregate & { sagyousha: string }): SagyoushaMetrics {
    return {
      sagyousha: row.sagyousha,
      ken: toInt(row.ken),
      yoryo: toInt(row.yoryo),
      furyo: toInt(row.furyo),
    };
  }

  /** 納期遅れ 明細の 1 行 */
  okureRow(row: OkureAggregate): OkureMetrics {
    const suryo = toInt(row.suryo);
    const kanryoSuryo = toInt(row.kanryo_suryo);
    return {
      shiji_no: row.shiji_no,
      hinmoku_nm: row.hinmoku_nm,
      noki_ymd: row.noki_ymd,
      suryo,
      kanryo_suryo: kanryoSuryo,
      zansu: suryo - kanryoSuryo,
      tokui_nm: row.tokui_nm,
    };
  }
}
