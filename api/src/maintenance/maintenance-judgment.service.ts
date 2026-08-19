import { Injectable } from '@nestjs/common';

/** t_hozen.teishi_jikan の DECIMAL(8,2) と同じ小数2桁精度 */
const SCALE = 100;

/** DECIMAL(8,2) の絶対値上限 (1/100 単位) */
export const TEISHI_JIKAN_MAX_CENTI = 99999999;

/** app/maintenance.cfm の経過年数は 365 日固定で割っている */
export const NENSU_DAYS = 365;

const YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * 数値として解釈できる値を小数2桁の整数値へ変換する。
 * 数値でない場合は null を返す。
 */
export function toCenti(value: unknown): number | null {
  if (typeof value === 'number') {
    // 文字列経路と同じ丸めになるよう十進表記へ変換してから処理する
    return Number.isFinite(value) ? toCenti(value.toFixed(10)) : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === '' || !/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(trimmed)) {
    return null;
  }
  const signed = trimmed.startsWith('+') || trimmed.startsWith('-');
  const sign = trimmed.startsWith('-') ? -1 : 1;
  const digits = signed ? trimmed.slice(1) : trimmed;
  const [intPart, fracPart = ''] = digits.split('.');
  const frac = (fracPart + '00').slice(0, 2);
  const rest = fracPart.slice(2);
  let centi = Number(intPart || '0') * SCALE + Number(frac);
  // 3桁目以降は四捨五入 (DECIMAL(8,2) への格納と同じ丸め)
  if (rest.length > 0 && Number(rest[0]) >= 5) {
    centi += 1;
  }
  return sign * centi;
}

/** 1/100 単位の整数を DECIMAL(8,2) 表記の十進文字列へ戻す */
export function centiToDecimalString(centi: number): string {
  const sign = centi < 0 ? '-' : '';
  const abs = Math.abs(centi);
  return `${sign}${Math.trunc(abs / SCALE)}.${String(abs % SCALE).padStart(2, '0')}`;
}

/** 数値として解釈できる値を DECIMAL(8,2) 表記へ正規化する。数値でない場合は null */
export function toDecimalString(value: unknown): string | null {
  const centi = toCenti(value);
  return centi === null ? null : centiToDecimalString(centi);
}

/** 'YYYY-MM-DD' (先頭一致) を UTC ミリ秒へ。日付として解釈できない場合は null */
export function parseYmd(value: unknown): number | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value !== 'string') {
    return null;
  }
  const matched = YMD_PATTERN.exec(value.trim());
  if (matched === null) {
    return null;
  }
  const [, y, m, d] = matched;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const ms = Date.UTC(year, month - 1, day);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== year || back.getUTCMonth() !== month - 1 || back.getUTCDate() !== day) {
    return null;
  }
  return ms;
}

const DAY_MS = 86400000;

/** UTC ミリ秒を 'YYYY-MM-DD' へ */
export function formatYmd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export interface TenkenPlan {
  /** 経過年数 (年) */
  keika: number;
  /** 次回点検予定日 'YYYY-MM-DD'。定期点検の記録がない場合は null */
  next_ymd: string | null;
  /** 期限超過 (記録なしの場合も true) */
  okure: boolean;
}

@Injectable()
export class MaintenanceJudgmentService {
  /**
   * app/maintenance.cfm の点検周期ロジックをそのまま移したもの。
   *
   *   keika = int(dateDiff("d", dounyu_ymd, now()) / 365)
   *   if (isDate(last_ymd)) {
   *     nextYmd = dateAdd("d", tenken_cycle, last_ymd)
   *     okure   = dateCompare(nextYmd, now(), "d") LT 0     // 日単位で厳密に「未満」
   *   } else {
   *     nextYmd = ""
   *     okure   = true                                      // 定期点検の記録なしは常に超過扱い
   *   }
   */
  plan(input: {
    dounyu_ymd: unknown;
    tenken_cycle: unknown;
    last_ymd: unknown;
    today: unknown;
  }): TenkenPlan {
    const todayMs = parseYmd(input.today);
    if (todayMs === null) {
      throw new Error('today は日付で指定してください。');
    }
    const dounyuMs = parseYmd(input.dounyu_ymd);
    const lastMs = parseYmd(input.last_ymd);
    const cycle = this.toCycleDays(input.tenken_cycle);

    const keika =
      dounyuMs === null ? 0 : Math.trunc(Math.round((todayMs - dounyuMs) / DAY_MS) / NENSU_DAYS);

    if (lastMs === null || cycle === null) {
      // CFML では点検周期が数値でない場合 dateAdd が失敗するため、記録なしと同じ扱いにする
      return { keika, next_ymd: null, okure: true };
    }
    const nextMs = lastMs + cycle * DAY_MS;
    return { keika, next_ymd: formatYmd(nextMs), okure: nextMs < todayMs };
  }

  /** 未復旧件数から状態表示を決める (qOpen.ken GT 0) */
  isKadou(openKen: unknown): boolean {
    const ken = typeof openKen === 'number' ? openKen : Number(openKen);
    return !(Number.isFinite(ken) && ken > 0);
  }

  private toCycleDays(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = typeof value === 'number' ? value : Number(String(value).trim());
    return Number.isInteger(num) ? num : null;
  }
}
