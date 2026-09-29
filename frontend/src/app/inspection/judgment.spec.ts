import { describe, expect, it } from 'vitest';
import { judge, parseMeasurement, previewJudgment } from './judgment';

describe('previewJudgment (InspectionJudgmentService と同一ルール)', () => {
  const specs: Array<[string, string]> = [
    ['219.900', '220.100'],
    ['44.980', '45.020'],
    ['0.000', '0.050'],
  ];

  const offset = (base: string, delta: number): string => {
    const r = parseMeasurement('x', base);
    if (!r.ok) throw new Error(base);
    const v = r.value + BigInt(delta);
    const sign = v < 0n ? '-' : '';
    const abs = (v < 0n ? -v : v).toString().padStart(4, '0');
    return `${sign}${abs.slice(0, -3)}.${abs.slice(-3)}`;
  };

  for (const [min, max] of specs) {
    const cases: Array<[string, string, string]> = [
      ['sunpou < kijun_min', offset(min, -1), 'NG'],
      ['sunpou == kijun_min (下限は再検査対象外)', min, 'OK'],
      ['sunpou > kijun_max', offset(max, 1), 'NG'],
      ['sunpou == kijun_max (差 0.000)', max, '再検査'],
      ['sunpou == kijun_max - 0.009', offset(max, -9), '再検査'],
      ['sunpou == kijun_max - 0.010 (差ちょうど 0.010)', offset(max, -10), 'OK'],
      ['sunpou == kijun_max - 0.011', offset(max, -11), 'OK'],
    ];
    for (const [name, sunpou, expected] of cases) {
      it(`${min}〜${max}: ${name} (${sunpou}) → ${expected}`, () => {
        expect(previewJudgment(sunpou, min, max)).toEqual({ hantei: expected });
      });
    }
  }

  it('範囲中央値 → OK', () => {
    expect(previewJudgment('220.000', '219.900', '220.100')).toEqual({ hantei: 'OK' });
  });

  it.each([
    ['220.100', '220.090'],
    ['1.007', '0.997'],
    ['2.050', '2.040'],
  ])('浮動小数点誤差が出る組でも差ちょうど 0.010 は OK (max=%s, sunpou=%s)', (max, sunpou) => {
    expect(previewJudgment(sunpou, '0.000', max)).toEqual({ hantei: 'OK' });
  });

  it.each(['', ' ', 'abc', '220.0.0', '２２０', '1,000', 'NaN'])(
    '非数値/未入力 "%s" は判定に到達しない',
    (sunpou) => {
      expect(previewJudgment(sunpou, '219.900', '220.100')).toEqual({
        error: '測定値は数値で入力してください。',
      });
    },
  );

  it('DECIMAL(8,3) を超える値はエラー', () => {
    expect(previewJudgment('220.0001', '219.900', '220.100')).toEqual({
      error: '測定値は整数部5桁・小数部3桁以内で入力してください。',
    });
    expect(previewJudgment('100000', '219.900', '220.100')).toEqual({
      error: '測定値は整数部5桁・小数部3桁以内で入力してください。',
    });
  });
});

describe('parseMeasurement', () => {
  it.each([
    ['220.000', 220000n],
    ['220.1', 220100n],
    [' 219.900 ', 219900n],
    ['220', 220000n],
    ['-0.5', -500n],
    ['.5', 500n],
    ['2.2E2', 220000n],
    ['220.1000', 220100n],
    ['99999.999', 99999999n],
    ['0.0000', 0n],
  ])('"%s" → %s', (raw, expected) => {
    expect(parseMeasurement('測定値', raw)).toEqual({ ok: true, value: expected });
  });
});

describe('judge', () => {
  it('規格外は再検査より NG を優先', () => {
    expect(judge(220105n, 219900n, 220100n)).toBe('NG');
  });
});
