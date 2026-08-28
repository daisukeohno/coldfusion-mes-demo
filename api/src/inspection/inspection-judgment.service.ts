import { Injectable } from '@nestjs/common';

export type Hantei = 'OK' | 'NG' | '再検査';

/** t_kensa の DECIMAL(8,3) と同じ小数3桁精度 */
const SCALE = 1000;

/** 再検査となる規格上限との差 (mm)。2011年の暫定運用 */
export const SAIKENSA_MARGIN_MILLI = 10;

export class NonNumericMeasurementError extends Error {
  constructor() {
    super('測定値は数値で入力してください。');
    this.name = 'NonNumericMeasurementError';
  }
}

export class NonNumericSpecLimitError extends Error {
  constructor() {
    super('規格下限・規格上限は数値で入力してください。');
    this.name = 'NonNumericSpecLimitError';
  }
}

/**
 * 数値として解釈できる値を小数3桁の整数値へ変換する。
 * 数値でない場合は null を返す。
 */
export function toMilli(value: unknown): number | null {
  if (typeof value === 'number') {
    // 文字列経路と同じ丸めになるよう十進表記へ変換してから処理する
    return Number.isFinite(value) ? toMilli(value.toFixed(10)) : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === '' || !/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(trimmed)) {
    return null;
  }
  const [sign, digits] = trimmed.startsWith('+') || trimmed.startsWith('-')
    ? [trimmed[0] === '-' ? -1 : 1, trimmed.slice(1)]
    : [1, trimmed];
  const [intPart, fracPart = ''] = digits.split('.');
  const frac = (fracPart + '000').slice(0, 3);
  const rest = fracPart.slice(3);
  let milli = Number(intPart || '0') * SCALE + Number(frac);
  // 4桁目以降は四捨五入 (DECIMAL(8,3) への格納と同じ丸め)
  if (rest.length > 0 && Number(rest[0]) >= 5) {
    milli += 1;
  }
  return sign * milli;
}

/** CFML の isNumeric() 相当 (このアプリで扱う十進表記のみ) */
export function isNumericValue(value: unknown): boolean {
  return toMilli(value) !== null;
}

/** DECIMAL(8,3) 列へバインドするための正規化済み文字列 (例: ' +220.1 ' -> '220.100') */
export function toDecimalString(value: unknown): string | null {
  const milli = toMilli(value);
  if (milli === null) {
    return null;
  }
  const sign = milli < 0 ? '-' : '';
  const abs = Math.abs(milli);
  return `${sign}${Math.trunc(abs / SCALE)}.${String(abs % SCALE).padStart(3, '0')}`;
}

@Injectable()
export class InspectionJudgmentService {
  /**
   * app/inspection.cfm の判定ロジック。
   *
   *   hantei = "OK"
   *   if (sunpou < kijun_min || sunpou > kijun_max) hantei = "NG"
   *   if (hantei == "OK" && (kijun_max - sunpou) < 0.010) hantei = "再検査"
   *
   * 比較は DECIMAL(8,3) 精度の整数演算で行い、浮動小数点誤差で判定が変わらないようにする。
   */
  judge(sunpou: unknown, kijunMin: unknown, kijunMax: unknown): Hantei {
    const sunpouMilli = toMilli(sunpou);
    if (sunpouMilli === null) {
      throw new NonNumericMeasurementError();
    }
    const minMilli = toMilli(kijunMin);
    const maxMilli = toMilli(kijunMax);
    if (minMilli === null || maxMilli === null) {
      throw new NonNumericSpecLimitError();
    }

    let hantei: Hantei = 'OK';
    if (sunpouMilli < minMilli || sunpouMilli > maxMilli) {
      hantei = 'NG';
    }
    if (hantei === 'OK' && maxMilli - sunpouMilli < SAIKENSA_MARGIN_MILLI) {
      hantei = '再検査';
    }
    return hantei;
  }
}
