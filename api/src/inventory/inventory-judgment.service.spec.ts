import {
  fromSen,
  InvalidQuantityError,
  InventoryJudgmentService,
  isNumericValue,
  MAX_QUANTITY,
  QuantityOutOfRangeError,
  toSen,
} from './inventory-judgment.service';

describe('InventoryJudgmentService', () => {
  const service = new InventoryJudgmentService();

  describe('judge (発注点・安全在庫の境界値)', () => {
    // 安全在庫 300 / 発注点 450 の部品を基準に境界を確認する
    const anzen = 300;
    const hacchu = 450;

    it('安全在庫を1個下回ると欠品リスク', () => {
      expect(service.judge(299, anzen, hacchu)).toBe('欠品リスク');
    });

    it('安全在庫ちょうどは欠品リスクではなく発注点割れ (LT の厳密不等号)', () => {
      expect(service.judge(300, anzen, hacchu)).toBe('発注点割れ');
    });

    it('発注点を1個下回ると発注点割れ', () => {
      expect(service.judge(449, anzen, hacchu)).toBe('発注点割れ');
    });

    it('発注点ちょうどは適正 (LT の厳密不等号)', () => {
      expect(service.judge(450, anzen, hacchu)).toBe('適正');
    });

    it('発注点を1個上回ると適正', () => {
      expect(service.judge(451, anzen, hacchu)).toBe('適正');
    });

    it('在庫0で安全在庫0・発注点0なら適正', () => {
      expect(service.judge(0, 0, 0)).toBe('適正');
    });

    it('安全在庫 > 発注点 の設定でも安全在庫の判定が先に効く', () => {
      expect(service.judge(400, 500, 450)).toBe('欠品リスク');
    });

    it('NULL の閾値は 0 として扱う', () => {
      expect(service.judge(0, null, null)).toBe('適正');
      expect(service.judge('1240', '400', '600')).toBe('適正');
    });
  });

  describe('validateQuantity (入出庫数の境界値)', () => {
    it('1 は許可される (下限ちょうど)', () => {
      expect(service.validateQuantity('1')).toBe(1);
      expect(service.validateQuantity(1)).toBe(1);
    });

    it('0 と負数は NG (LTE 0)', () => {
      expect(() => service.validateQuantity('0')).toThrow(InvalidQuantityError);
      expect(() => service.validateQuantity('0')).toThrow(
        '数量は1以上の数値で入力してください。',
      );
      expect(() => service.validateQuantity('-1')).toThrow(InvalidQuantityError);
      expect(() => service.validateQuantity('0.000')).toThrow(InvalidQuantityError);
    });

    it('0 より大きい最小単位は許可される (0.001)', () => {
      expect(service.validateQuantity('0.001')).toBe(0);
    });

    it('小数は cf_sql_integer と同じ四捨五入で整数化される', () => {
      expect(service.validateQuantity('10.4')).toBe(10);
      expect(service.validateQuantity('10.5')).toBe(11);
    });

    it('非数値は NG で例外', () => {
      for (const value of ['', ' ', 'あ', '10個', '1e3', '1,000', null, undefined, {}]) {
        expect(() => service.validateQuantity(value)).toThrow(InvalidQuantityError);
      }
    });

    it('INT 上限ちょうどは許可、+1 は範囲外', () => {
      expect(service.validateQuantity(String(MAX_QUANTITY))).toBe(MAX_QUANTITY);
      expect(() => service.validateQuantity(String(MAX_QUANTITY + 1))).toThrow(
        QuantityOutOfRangeError,
      );
    });

    it('前後の空白と符号付き表記は許容する', () => {
      expect(service.validateQuantity(' 10 ')).toBe(10);
      expect(service.validateQuantity('+10')).toBe(10);
    });
  });

  describe('movementMessage', () => {
    it('CFML と同一文言', () => {
      expect(service.movementMessage('nyuko')).toBe('入庫を登録しました。');
      expect(service.movementMessage('shukko')).toBe('出庫を登録しました。');
    });
  });

  describe('在庫金額の十進加算', () => {
    it('浮動小数点誤差なしで合計できる', () => {
      const total = ['47120.00', '12960.00', '0.10', '0.20'].reduce(
        (sum, value) => sum + toSen(value),
        0,
      );
      expect(fromSen(total)).toBe('60080.30');
    });

    it('DECIMAL 文字列の 1/100 単位への変換', () => {
      expect(toSen('38.00')).toBe(3800);
      expect(toSen('0.05')).toBe(5);
      expect(toSen(null)).toBe(0);
      expect(fromSen(5)).toBe('0.05');
    });
  });

  describe('isNumericValue', () => {
    it('CFML の isNumeric() と同じ判定 (十進表記のみ)', () => {
      expect(isNumericValue('220')).toBe(true);
      expect(isNumericValue('.5')).toBe(true);
      expect(isNumericValue('abc')).toBe(false);
    });
  });
});
