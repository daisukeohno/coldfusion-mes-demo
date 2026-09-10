import { Injectable } from '@nestjs/common';

export type Hantei = 'OK' | 'NG' | '再検査';

/** 2011年暫定運用: 規格上限との差がこの値未満なら「再検査」(inspection.cfm の LT 0.010) */
export const REINSPECTION_THRESHOLD_MM = '0.010';

export const INVALID_SUNPOU_MESSAGE = '測定値は数値で入力してください。';

export type JudgmentResult =
  { valid: true; hantei: Hantei } | { valid: false; message: string };

const NUMERIC_PATTERN = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;

/**
 * 10進文字列を誤差なく比較するための固定小数点表現 (BigInt + 桁数)。
 * DECIMAL(8,3) の値同士を浮動小数点に変換すると 0.010 の境界判定がぶれるため。
 */
function fractionDigits(value: string): number {
  const idx = value.indexOf('.');
  return idx < 0 ? 0 : value.length - idx - 1;
}

function toScaled(value: string, scale: number): bigint {
  const negative = value.startsWith('-');
  const unsigned = value.replace(/^[+-]/, '');
  const [intPart, fracPart = ''] = unsigned.split('.');
  const digits = (intPart || '0') + fracPart.padEnd(scale, '0');
  const n = BigInt(digits);
  return negative ? -n : n;
}

@Injectable()
export class InspectionJudgmentService {
  isNumeric(value: unknown): value is string | number {
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value !== 'string') return false;
    return NUMERIC_PATTERN.test(value.trim());
  }

  /**
   * ルール2: 既定 OK。sunpou < kijun_min または sunpou > kijun_max で NG。
   * ルール3: OK かつ (kijun_max - sunpou) < 0.010 で 再検査 (0.010 ちょうどは OK)。
   */
  judge(
    sunpou: string | number,
    kijunMin: string | number,
    kijunMax: string | number,
  ): JudgmentResult {
    if (
      !this.isNumeric(sunpou) ||
      !this.isNumeric(kijunMin) ||
      !this.isNumeric(kijunMax)
    ) {
      return { valid: false, message: INVALID_SUNPOU_MESSAGE };
    }
    const s = String(sunpou).trim();
    const min = String(kijunMin).trim();
    const max = String(kijunMax).trim();
    const scale = Math.max(
      fractionDigits(s),
      fractionDigits(min),
      fractionDigits(max),
      fractionDigits(REINSPECTION_THRESHOLD_MM),
    );
    const sv = toScaled(s, scale);
    const minV = toScaled(min, scale);
    const maxV = toScaled(max, scale);
    const threshold = toScaled(REINSPECTION_THRESHOLD_MM, scale);

    let hantei: Hantei = 'OK';
    if (sv < minV || sv > maxV) {
      hantei = 'NG';
    }
    if (hantei === 'OK' && maxV - sv < threshold) {
      hantei = '再検査';
    }
    return { valid: true, hantei };
  }
}
