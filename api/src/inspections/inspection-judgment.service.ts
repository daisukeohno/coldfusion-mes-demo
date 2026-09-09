import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';

export type Hantei = 'OK' | 'NG' | '再検査';

export const SUNPOU_NOT_NUMERIC_MESSAGE = '測定値は数値で入力してください。';

/** 規格上限との差がこの値「未満」なら再検査 (下限側は対象外) */
export const SAIKENSA_TOLERANCE = new Decimal('0.010');

export class InvalidMeasurementError extends Error {
  constructor(message: string = SUNPOU_NOT_NUMERIC_MESSAGE) {
    super(message);
    this.name = 'InvalidMeasurementError';
  }
}

export interface JudgmentInput {
  sunpou: string | number;
  kijun_min: string | number;
  kijun_max: string | number;
}

const NUMERIC_PATTERN = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

/**
 * app/inspection.cfm の判定ロジック (9〜21行目) を DB / HTTP から独立した純粋関数として再現する。
 * 小数は DECIMAL(8,3) 相当の精度で扱うため decimal.js を使用し、浮動小数の丸め誤差を排除する。
 */
@Injectable()
export class InspectionJudgmentService {
  isNumeric(value: unknown): boolean {
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value !== 'string') return false;
    return NUMERIC_PATTERN.test(value.trim());
  }

  toDecimal(value: string | number, fieldName: string): Decimal {
    if (!this.isNumeric(value)) {
      if (fieldName === 'sunpou') throw new InvalidMeasurementError();
      throw new InvalidMeasurementError(
        `${fieldName} は数値で入力してください。`,
      );
    }
    return new Decimal(typeof value === 'string' ? value.trim() : value);
  }

  judge(input: JudgmentInput): Hantei {
    const sunpou = this.toDecimal(input.sunpou, 'sunpou');
    const kijunMin = this.toDecimal(input.kijun_min, 'kijun_min');
    const kijunMax = this.toDecimal(input.kijun_max, 'kijun_max');

    let hantei: Hantei = 'OK';
    if (sunpou.lt(kijunMin) || sunpou.gt(kijunMax)) {
      hantei = 'NG';
    }
    if (hantei === 'OK' && kijunMax.minus(sunpou).lt(SAIKENSA_TOLERANCE)) {
      hantei = '再検査';
    }
    return hantei;
  }
}
