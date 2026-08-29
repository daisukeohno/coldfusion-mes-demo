import { Injectable } from '@nestjs/common';

/** t_kotei_jisseki.yoryo_suryo / furyo_suryo は INT 列 */
export const INT_MIN = -2147483648;
export const INT_MAX = 2147483647;

export class NonNumericQuantityError extends Error {
  constructor() {
    // app/progress.cfm の検証メッセージをそのまま保持する
    super('良品数と不良数は数値で入力してください。');
    this.name = 'NonNumericQuantityError';
  }
}

export class NonIntegerQuantityError extends Error {
  constructor() {
    super('良品数と不良数は整数で入力してください。');
    this.name = 'NonIntegerQuantityError';
  }
}

export class QuantityOutOfRangeError extends Error {
  constructor() {
    super('良品数と不良数は -2147483648 〜 2147483647 の範囲で入力してください。');
    this.name = 'QuantityOutOfRangeError';
  }
}

/**
 * 数値として解釈できる十進表記かどうか (CFML の isNumeric() 相当。
 * このアプリで扱う表記のみを許容する)。
 */
export function isNumericValue(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  return trimmed !== '' && /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(trimmed);
}

/** 十進表記が整数値かどうか (小数部が 0 のみで構成される場合も整数扱い) */
function isIntegerText(text: string): boolean {
  const [, fracPart = ''] = text.replace(/^[+-]/, '').split('.');
  return /^0*$/.test(fracPart);
}

@Injectable()
export class ProgressQuantityService {
  /**
   * 数量入力の検証。app/progress.cfm は isNumeric() のみを見るため、
   * 数値でない場合のメッセージは CFML と同一。整数・INT 範囲の検証は
   * CFML では DB 例外になっていた分を 400 に置き換えたもの。
   */
  parseCount(value: unknown): number {
    if (!isNumericValue(value)) {
      throw new NonNumericQuantityError();
    }
    const text = typeof value === 'number' ? String(value) : String(value).trim();
    if (!isIntegerText(text)) {
      throw new NonIntegerQuantityError();
    }
    const parsed = Number(text);
    if (parsed < INT_MIN || parsed > INT_MAX) {
      throw new QuantityOutOfRangeError();
    }
    return parsed;
  }

  /**
   * 工程完了フラグ。CFML は form.kanryo EQ "1" のときだけ shuryo_dt に now() を入れる。
   * CFML の EQ は数値として比較できる場合は数値比較になるため "1.0" も完了扱いになる。
   */
  isKanryo(value: unknown): boolean {
    if (isNumericValue(value)) {
      return Number(typeof value === 'number' ? value : String(value).trim()) === 1;
    }
    return String(value ?? '') === '1';
  }
}
