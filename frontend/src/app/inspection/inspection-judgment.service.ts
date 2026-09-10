import { Injectable } from '@angular/core';
import { Hantei } from './inspection.models';

/**
 * api/src/inspections/inspection-judgment.service.ts と同じロジックの TypeScript 実装。
 * 入力中の即時プレビュー専用。正式な判定はサーバ (POST /api/inspections) の結果を採用する。
 */
export const REINSPECTION_THRESHOLD_MM = '0.010';

export type JudgmentPreview = { valid: true; hantei: Hantei } | { valid: false; message: string };

const NUMERIC_PATTERN = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;

function fractionDigits(value: string): number {
  const idx = value.indexOf('.');
  return idx < 0 ? 0 : value.length - idx - 1;
}

function toScaled(value: string, scale: number): bigint {
  const negative = value.startsWith('-');
  const unsigned = value.replace(/^[+-]/, '');
  const [intPart, fracPart = ''] = unsigned.split('.');
  const n = BigInt((intPart || '0') + fracPart.padEnd(scale, '0'));
  return negative ? -n : n;
}

@Injectable({ providedIn: 'root' })
export class InspectionJudgmentService {
  isNumeric(value: string): boolean {
    return NUMERIC_PATTERN.test(value.trim());
  }

  judge(sunpou: string, kijunMin: string, kijunMax: string): JudgmentPreview {
    if (!this.isNumeric(sunpou) || !this.isNumeric(kijunMin) || !this.isNumeric(kijunMax)) {
      return { valid: false, message: '測定値は数値で入力してください。' };
    }
    const s = sunpou.trim();
    const min = kijunMin.trim();
    const max = kijunMax.trim();
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
    if (sv < minV || sv > maxV) hantei = 'NG';
    if (hantei === 'OK' && maxV - sv < threshold) hantei = '再検査';
    return { valid: true, hantei };
  }
}
