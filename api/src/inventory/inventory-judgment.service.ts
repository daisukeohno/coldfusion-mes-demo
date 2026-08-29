import { Injectable } from '@nestjs/common';

export type ZaikoHantei = '欠品リスク' | '発注点割れ' | '適正';

export type MovementMode = 'nyuko' | 'shukko';

/** 入出庫数の小数を扱うための内部スケール (千分の1単位) */
const SCALE = 1000;

/** t_zaiko.zaiko_su は INT。cf_sql_integer と同じ上限 */
export const MAX_QUANTITY = 2147483647;

export class InvalidQuantityError extends Error {
  constructor() {
    super('数量は1以上の数値で入力してください。');
    this.name = 'InvalidQuantityError';
  }
}

export class QuantityOutOfRangeError extends Error {
  constructor() {
    super(`数量は ${MAX_QUANTITY} 以下で入力してください。`);
    this.name = 'QuantityOutOfRangeError';
  }
}

/**
 * 数値として解釈できる値を 1/1000 単位の整数へ変換する。
 * 数値でない場合は null を返す (CFML の isNumeric() 相当。指数表記は扱わない)。
 */
export function toMilli(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? toMilli(value.toFixed(10)) : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === '' || !/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(trimmed)) {
    return null;
  }
  const signed = trimmed.startsWith('+') || trimmed.startsWith('-');
  const sign = signed && trimmed[0] === '-' ? -1 : 1;
  const digits = signed ? trimmed.slice(1) : trimmed;
  const [intPart, fracPart = ''] = digits.split('.');
  const frac = (fracPart + '000').slice(0, 3);
  const rest = fracPart.slice(3);
  let milli = Number(intPart || '0') * SCALE + Number(frac);
  if (rest.length > 0 && Number(rest[0]) >= 5) {
    milli += 1;
  }
  return sign * milli;
}

/** CFML の isNumeric() 相当 (このアプリで扱う十進表記のみ) */
export function isNumericValue(value: unknown): boolean {
  return toMilli(value) !== null;
}

/** DECIMAL の十進文字列を 1/100 単位の整数へ変換する (在庫金額の合計用) */
export function toSen(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const milli = toMilli(value);
  return milli === null ? 0 : Math.round(milli / 10);
}

/** 1/100 単位の整数を DECIMAL の十進文字列へ戻す */
export function fromSen(sen: number): string {
  const sign = sen < 0 ? '-' : '';
  const abs = Math.abs(sen);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** INT 列の値を数値化する (NULL は CFML と同じく 0 扱い) */
function toIntColumn(value: unknown): number {
  const milli = toMilli(value);
  return milli === null ? 0 : Math.round(milli / SCALE);
}

@Injectable()
export class InventoryJudgmentService {
  /**
   * app/inventory.cfm の在庫判定ロジック。
   *
   *   if (zaiko_su < anzen_zaiko)      hantei = "欠品リスク"
   *   else if (zaiko_su < hacchu_ten)  hantei = "発注点割れ"
   *   else                             hantei = "適正"
   *
   * いずれも INT 列同士の厳密不等号 (LT) 比較。閾値ちょうどは下位判定にならない。
   */
  judge(zaikoSu: unknown, anzenZaiko: unknown, hacchuTen: unknown): ZaikoHantei {
    const zaiko = toIntColumn(zaikoSu);
    const anzen = toIntColumn(anzenZaiko);
    const hacchu = toIntColumn(hacchuTen);

    if (zaiko < anzen) {
      return '欠品リスク';
    }
    if (zaiko < hacchu) {
      return '発注点割れ';
    }
    return '適正';
  }

  /**
   * 入出庫数の検証。app/inventory.cfm の
   *   if (NOT isNumeric(form.su) OR form.su LTE 0) → "NG:数量は1以上の数値で入力してください。"
   * と同じ評価順序・境界 (0 は不可、0 より大きければ可)。
   *
   * 比較は 1/1000 単位の整数で行い、浮動小数点誤差で境界判定が変わらないようにする。
   * 戻り値は cf_sql_integer へのバインドと同じ四捨五入済みの整数。
   */
  validateQuantity(value: unknown): number {
    const milli = toMilli(value);
    if (milli === null || milli <= 0) {
      throw new InvalidQuantityError();
    }
    const quantity = Math.round(milli / SCALE);
    if (quantity > MAX_QUANTITY) {
      throw new QuantityOutOfRangeError();
    }
    return quantity;
  }

  /** 入出庫登録後のメッセージ (CFML の msg と同一文言) */
  movementMessage(mode: MovementMode): string {
    return `${mode === 'nyuko' ? '入庫' : '出庫'}を登録しました。`;
  }
}
