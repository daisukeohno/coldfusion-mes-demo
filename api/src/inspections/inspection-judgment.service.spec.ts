import {
  InspectionJudgmentService,
  InvalidMeasurementError,
  SUNPOU_NOT_NUMERIC_MESSAGE,
} from './inspection-judgment.service.js';

// 現行 app/inspection.cfm (9〜21行目) の判定ルールに対する境界値テスト。
// 規格: kijun_min=219.900, kijun_max=220.100
const KIJUN = { kijun_min: '219.900', kijun_max: '220.100' };

describe('InspectionJudgmentService', () => {
  const service = new InspectionJudgmentService();
  const judge = (sunpou: string | number) =>
    service.judge({ sunpou, ...KIJUN });

  describe('境界値 (kijun_min=219.900, kijun_max=220.100)', () => {
    it.each([
      ['下限ちょうど (sunpou == kijun_min)', '219.900', 'OK'],
      ['下限直下 (kijun_min - 0.001)', '219.899', 'NG'],
      ['上限ちょうど (sunpou == kijun_max, 差 0 < 0.010)', '220.100', '再検査'],
      ['上限との差 0.009 (kijun_max - 0.009)', '220.091', '再検査'],
      [
        '上限との差ちょうど 0.010 (kijun_max - 0.010, 未満ではない)',
        '220.090',
        'OK',
      ],
      ['上限との差 0.011 (kijun_max - 0.011)', '220.089', 'OK'],
      ['下限側は許容差判定の対象外 (kijun_min + 0.001)', '219.901', 'OK'],
      ['上限超過 (kijun_max + 0.001)', '220.101', 'NG'],
      ['規格中央', '220.000', 'OK'],
    ] as const)('%s → %s', (_label, sunpou, expected) => {
      expect(judge(sunpou)).toBe(expected);
    });
  });

  describe('小数精度 (DECIMAL(8,3) 相当)', () => {
    it('浮動小数では 220.100 - 220.090 = 0.00999... となるが、判定は OK のまま', () => {
      // 浮動小数演算だと 0.010 未満と誤判定される値
      expect(220.1 - 220.09 < 0.01).toBe(true);
      expect(judge(220.09)).toBe('OK');
      expect(judge('220.090')).toBe('OK');
    });

    it('数値型で渡しても文字列と同じ判定になる', () => {
      expect(judge(220.091)).toBe('再検査');
      expect(judge(219.899)).toBe('NG');
      expect(judge(219.9)).toBe('OK');
    });
  });

  describe('測定値が非数値', () => {
    it.each(['abc', '', ' ', '220.0.0', '22O.000', null, undefined, NaN])(
      '%s → InvalidMeasurementError (登録されない)',
      (sunpou) => {
        expect(() => judge(sunpou as unknown as string)).toThrow(
          InvalidMeasurementError,
        );
        expect(() => judge(sunpou as unknown as string)).toThrow(
          SUNPOU_NOT_NUMERIC_MESSAGE,
        );
      },
    );

    it('前後の空白付き数値は CF の isNumeric 同様に数値として扱う', () => {
      expect(judge(' 220.000 ')).toBe('OK');
    });
  });

  describe('規格値が非数値', () => {
    it('kijun_max が非数値なら例外', () => {
      expect(() =>
        service.judge({
          sunpou: '220.000',
          kijun_min: '219.900',
          kijun_max: 'x',
        }),
      ).toThrow(InvalidMeasurementError);
    });
  });
});
