import {
  Hantei,
  InspectionJudgmentService,
  NonNumericMeasurementError,
  NonNumericSpecLimitError,
  toDecimalString,
  toMilli,
} from './inspection-judgment.service';

describe('InspectionJudgmentService', () => {
  const service = new InspectionJudgmentService();
  const MIN = '219.900';
  const MAX = '220.100';
  const judge = (sunpou: unknown): Hantei => service.judge(sunpou, MIN, MAX);

  describe('境界値 (kijun_min=219.900 / kijun_max=220.100)', () => {
    it('219.899 は下限未満なので NG', () => {
      expect(judge('219.899')).toBe('NG');
    });

    it('219.900 は下限ちょうどなので OK', () => {
      expect(judge('219.900')).toBe('OK');
    });

    it('220.090 は上限との差がちょうど 0.010 なので OK', () => {
      expect(judge('220.090')).toBe('OK');
    });

    it('220.091 は上限との差 0.009 なので 再検査', () => {
      expect(judge('220.091')).toBe('再検査');
    });

    it('220.100 は上限ちょうど (差 0) なので 再検査', () => {
      expect(judge('220.100')).toBe('再検査');
    });

    it('220.101 は上限超過なので NG', () => {
      expect(judge('220.101')).toBe('NG');
    });

    it('範囲中央は OK', () => {
      expect(judge('220.000')).toBe('OK');
    });
  });

  describe('浮動小数点誤差', () => {
    it('数値型で渡しても差 0.010 の境界で誤判定しない', () => {
      // 220.1 - 220.09 は倍精度では 0.009999999999990905 になる
      expect(220.1 - 220.09 < 0.01).toBe(true);
      expect(service.judge(220.09, 219.9, 220.1)).toBe('OK');
      expect(service.judge(220.091, 219.9, 220.1)).toBe('再検査');
    });

    it('別の規格値でも差 0.010 ちょうどは OK / 0.009 は 再検査', () => {
      expect(service.judge('10.290', '10.000', '10.300')).toBe('OK');
      expect(service.judge('10.291', '10.000', '10.300')).toBe('再検査');
      expect(service.judge(0.29, 0, 0.3)).toBe('OK');
      expect(service.judge(0.291, 0, 0.3)).toBe('再検査');
    });

    it('規格幅が 0.010 未満の場合は下限ちょうどでも 再検査', () => {
      expect(service.judge('5.000', '5.000', '5.005')).toBe('再検査');
      expect(service.judge('4.999', '5.000', '5.005')).toBe('NG');
    });
  });

  describe('数値でない測定値', () => {
    it.each(['', '   ', 'abc', '220.0.0', '1e3', '２２０', null, undefined, {}, NaN])(
      '%p は NonNumericMeasurementError',
      (value) => {
        expect(() => judge(value)).toThrow(NonNumericMeasurementError);
        expect(() => judge(value)).toThrow('測定値は数値で入力してください。');
      },
    );

    it('規格値が数値でない場合は規格値用のエラー', () => {
      expect(() => service.judge('220.000', 'x', MAX)).toThrow(NonNumericSpecLimitError);
      expect(() => service.judge('220.000', MIN, 'x')).toThrow(NonNumericSpecLimitError);
      expect(() => service.judge('220.000', MIN, 'x')).toThrow(
        '規格下限・規格上限は数値で入力してください。',
      );
    });
  });

  describe('toMilli', () => {
    it.each<[unknown, number | null]>([
      ['220.100', 220100],
      ['220.1', 220100],
      ['220', 220000],
      ['.5', 500],
      ['-1.250', -1250],
      ['+2.5', 2500],
      ['220.1004', 220100],
      ['220.1005', 220101],
      [220.1, 220100],
      ['abc', null],
    ])('toMilli(%p) === %p', (input, expected) => {
      expect(toMilli(input)).toBe(expected);
    });

    it('数値型と文字列型で丸め結果が一致する', () => {
      expect(toMilli(220.1005)).toBe(toMilli('220.1005'));
      expect(toMilli(-1.2345)).toBe(toMilli('-1.2345'));
    });
  });

  describe('toDecimalString', () => {
    it.each<[unknown, string | null]>([
      [' 220.000 ', '220.000'],
      ['+220.1', '220.100'],
      ['220.', '220.000'],
      ['.5', '0.500'],
      [220.1, '220.100'],
      ['-1.25', '-1.250'],
      ['abc', null],
    ])('toDecimalString(%p) === %p', (input, expected) => {
      expect(toDecimalString(input)).toBe(expected);
    });
  });
});
