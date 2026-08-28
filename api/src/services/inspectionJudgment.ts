export type InspectionJudgment = 'OK' | 'NG' | '再検査';

export class InspectionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InspectionValidationError';
  }
}

export function parseDecimalToMillis(
  value: unknown,
  fieldName = '値',
): number {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new InspectionValidationError(`${fieldName}は数値で入力してください。`);
  }

  const text =
    typeof value === 'number'
      ? Number.isFinite(value)
        ? value.toString()
        : ''
      : value.trim();
  const match = /^([+-]?)(\d+)(?:\.(\d{1,3}))?$/.exec(text);

  if (!match) {
    throw new InspectionValidationError(`${fieldName}は数値で入力してください。`);
  }

  const sign = match[1] === '-' ? -1 : 1;
  const whole = Number(match[2]);
  const fraction = Number((match[3] ?? '').padEnd(3, '0'));
  const millis = sign * (whole * 1000 + fraction);

  if (!Number.isSafeInteger(millis)) {
    throw new InspectionValidationError(`${fieldName}は有効な範囲で入力してください。`);
  }

  return millis;
}

export function judge(
  sunpou: unknown,
  kijunMin: unknown,
  kijunMax: unknown,
): InspectionJudgment {
  const measurement = parseDecimalToMillis(sunpou, '測定値');
  const minimum = parseDecimalToMillis(kijunMin, '規格下限');
  const maximum = parseDecimalToMillis(kijunMax, '規格上限');

  let result: InspectionJudgment = 'OK';

  if (measurement < minimum || measurement > maximum) {
    result = 'NG';
  }

  if (result === 'OK' && maximum - measurement < 10) {
    result = '再検査';
  }

  return result;
}
