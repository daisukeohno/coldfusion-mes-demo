import {
  INT_MAX,
  INT_MIN,
  isNumericValue,
  NonIntegerQuantityError,
  NonNumericQuantityError,
  ProgressQuantityService,
  QuantityOutOfRangeError,
} from './progress-quantity.service';

describe('ProgressQuantityService', () => {
  const service = new ProgressQuantityService();

  describe('parseCount', () => {
    it.each<[unknown, number]>([
      ['0', 0],
      ['1', 1],
      [' 10 ', 10],
      ['+10', 10],
      ['-1', -1],
      ['10.0', 10],
      ['10.000', 10],
      [10, 10],
      [String(INT_MAX), INT_MAX],
      [String(INT_MIN), INT_MIN],
    ])('parseCount(%p) === %p', (input, expected) => {
      expect(service.parseCount(input)).toBe(expected);
    });

    it.each(['', '   ', 'abc', '１０', '1e3', '10..0', '1,000', null, undefined, {}, NaN])(
      '%p は CFML と同じ非数値メッセージ',
      (value) => {
        expect(() => service.parseCount(value)).toThrow(NonNumericQuantityError);
        expect(() => service.parseCount(value)).toThrow('良品数と不良数は数値で入力してください。');
      },
    );

    it('小数を含む数値は整数エラー', () => {
      expect(() => service.parseCount('10.5')).toThrow(NonIntegerQuantityError);
      expect(() => service.parseCount('-0.001')).toThrow(NonIntegerQuantityError);
    });

    it('INT 範囲の境界 ±1 は範囲エラー', () => {
      expect(() => service.parseCount(String(INT_MAX + 1))).toThrow(QuantityOutOfRangeError);
      expect(() => service.parseCount(String(INT_MIN - 1))).toThrow(QuantityOutOfRangeError);
    });
  });

  describe('isKanryo', () => {
    it.each<[unknown, boolean]>([
      ['1', true],
      [1, true],
      ['1.0', true],
      [' 1 ', true],
      ['0', false],
      [0, false],
      ['', false],
      ['2', false],
      ['完了', false],
      [null, false],
      [undefined, false],
    ])('isKanryo(%p) === %p', (input, expected) => {
      expect(service.isKanryo(input)).toBe(expected);
    });
  });

  describe('isNumericValue', () => {
    it.each<[unknown, boolean]>([
      ['0', true],
      ['.5', true],
      ['5.', true],
      ['-3', true],
      ['abc', false],
      ['', false],
      [Infinity, false],
      [NaN, false],
    ])('isNumericValue(%p) === %p', (input, expected) => {
      expect(isNumericValue(input)).toBe(expected);
    });
  });
});
