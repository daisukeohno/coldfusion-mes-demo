import { Hantei } from './inspection.models';

/**
 * 判定の即時プレビュー。権威ある判定はサーバ側 InspectionJudgmentService の結果を使う。
 * 同一ロジックを移植しており、値は 0.001 単位の整数 (bigint) で比較して浮動小数点誤差を避ける。
 */

const SCALE = 3;
const MAX_INTEGER_DIGITS = 5;
const RE_INSPECTION_MARGIN = 10n; // 0.010
const DECIMAL_PATTERN = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/;

export type ParseResult = { ok: true; value: bigint } | { ok: false; message: string };

export function parseMeasurement(label: string, raw: string | null | undefined): ParseResult {
  const notNumeric: ParseResult = { ok: false, message: `${label}は数値で入力してください。` };
  const text = (raw ?? '').trim();
  const match = DECIMAL_PATTERN.exec(text);
  if (!match) {
    return notNumeric;
  }
  const [, sign, intPart, fracPart, fracOnly, exponent] = match;
  let digits = (intPart ?? '') + (fracPart ?? fracOnly ?? '');
  let scale = (fracPart ?? fracOnly ?? '').length - Number(exponent ?? '0');
  digits = digits.replace(/^0+(?=\d)/, '');
  while (scale > 0 && digits.length > 1 && digits.endsWith('0')) {
    digits = digits.slice(0, -1);
    scale--;
  }
  const isZero = /^0*$/.test(digits);
  const integerDigits = isZero ? 0 : digits.length - scale;
  if ((!isZero && scale > SCALE) || integerDigits > MAX_INTEGER_DIGITS) {
    return {
      ok: false,
      message: `${label}は整数部${MAX_INTEGER_DIGITS}桁・小数部${SCALE}桁以内で入力してください。`,
    };
  }
  const unscaled = BigInt(digits || '0') * 10n ** BigInt(SCALE - Math.min(scale, SCALE));
  return { ok: true, value: sign === '-' ? -unscaled : unscaled };
}

export function judge(sunpou: bigint, kijunMin: bigint, kijunMax: bigint): Hantei {
  let hantei: Hantei = 'OK';
  if (sunpou < kijunMin || sunpou > kijunMax) {
    hantei = 'NG';
  }
  if (hantei === 'OK' && kijunMax - sunpou < RE_INSPECTION_MARGIN) {
    hantei = '再検査';
  }
  return hantei;
}

export function previewJudgment(
  sunpou: string,
  kijunMin: string,
  kijunMax: string,
): { hantei: Hantei } | { error: string } {
  const parsed = [
    parseMeasurement('測定値', sunpou),
    parseMeasurement('規格下限', kijunMin),
    parseMeasurement('規格上限', kijunMax),
  ];
  const values: bigint[] = [];
  for (const result of parsed) {
    if (!result.ok) {
      return { error: result.message };
    }
    values.push(result.value);
  }
  return { hantei: judge(values[0], values[1], values[2]) };
}
