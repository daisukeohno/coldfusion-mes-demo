import { Injectable } from '@nestjs/common';
import { StatusSummaryRow } from './dashboard.dto';

export interface AggregateTotals {
  total_ken: number;
  total_suryo: number;
  total_kanryo: number;
  total_furyo: number;
}

/**
 * 集計列 (count / sum) の値を整数へ変換する。
 * mysql2 は SUM() を文字列で返すため、浮動小数点を経由せず整数化する。
 * CFML は NULL を空文字として加算するため、NULL / 空文字は 0 として扱う。
 */
export function toCount(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return Math.trunc(value);
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  const text = String(value).trim();
  if (!/^[+-]?\d+(\.0*)?$/.test(text)) {
    return 0;
  }
  return Math.trunc(Number(text.split('.')[0]));
}

/** 非負の除算を整数演算で四捨五入する (半数切り上げ) */
function roundHalfUp(numerator: number, denominator: number): number {
  const sign = numerator < 0 ? -1 : 1;
  const abs = Math.abs(numerator);
  const quotient = Math.floor(abs / denominator);
  const remainder = abs % denominator;
  return sign * (remainder * 2 >= denominator ? quotient + 1 : quotient);
}

@Injectable()
export class DashboardMetricsService {
  /**
   * app/index.cfm の KPI 集計。
   *
   *   <cfloop query="qShiji"> totalKen += ken; totalSuryo += suryo; ... </cfloop>
   *
   * 状態別集計 (status でグループ化した全行) の単純合計であり、
   * 完了分も含む点は index.cfm と同じ。
   */
  totals(rows: StatusSummaryRow[]): AggregateTotals {
    return rows.reduce<AggregateTotals>(
      (acc, row) => ({
        total_ken: acc.total_ken + row.ken,
        total_suryo: acc.total_suryo + row.suryo,
        total_kanryo: acc.total_kanryo + row.kanryo,
        total_furyo: acc.total_furyo + row.furyo,
      }),
      { total_ken: 0, total_suryo: 0, total_kanryo: 0, total_furyo: 0 },
    );
  }

  /**
   * 不良率 (指示数ベース)。
   *
   *   furyoRate = totalSuryo GT 0 ? (totalFuryo / totalSuryo) * 100 : 0
   *   #numberFormat(furyoRate,"9.99")#
   *
   * report.cfm は完了数で割っているが、ダッシュボードは指示数ベースのまま維持する。
   * 小数2桁の四捨五入は整数演算で行い、浮動小数点誤差で表示が変わらないようにする。
   */
  furyoRate(totalFuryo: number, totalSuryo: number): string {
    if (!(totalSuryo > 0)) {
      return '0.00';
    }
    const hundredths = roundHalfUp(totalFuryo * 10000, totalSuryo);
    const sign = hundredths < 0 ? '-' : '';
    const abs = Math.abs(hundredths);
    const intPart = Math.trunc(abs / 100);
    const frac = String(abs % 100).padStart(2, '0');
    return `${sign}${intPart}.${frac}`;
  }

  /**
   * 状態別の進捗率。
   *
   *   rate = suryo GT 0 ? int((kanryo / suryo) * 100) : 0
   *
   * int() の切り捨てを整数演算で再現する (0 除算時は 0)。
   */
  progressRate(kanryo: number, suryo: number): number {
    if (!(suryo > 0)) {
      return 0;
    }
    return Math.floor((kanryo * 100) / suryo);
  }
}
