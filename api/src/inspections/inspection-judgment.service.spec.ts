import {
  INVALID_SUNPOU_MESSAGE,
  InspectionJudgmentService,
  REINSPECTION_THRESHOLD_MM,
} from './inspection-judgment.service';

describe('InspectionJudgmentService (境界値)', () => {
  const svc = new InspectionJudgmentService();
  const ok = (s: string, min = '219.900', max = '220.100') =>
    svc.judge(s, min, max);

  it('しきい値定数は 0.010', () => {
    expect(REINSPECTION_THRESHOLD_MM).toBe('0.010');
  });

  it('sunpou == kijun_min → OK', () => {
    expect(ok('219.900')).toEqual({ valid: true, hantei: 'OK' });
  });

  it('sunpou が kijun_min をわずかに下回る → NG', () => {
    expect(ok('219.899')).toEqual({ valid: true, hantei: 'NG' });
  });

  it('sunpou == kijun_max → 差 0 で 0.010 未満のため 再検査', () => {
    expect(ok('220.100')).toEqual({ valid: true, hantei: '再検査' });
  });

  it('sunpou が kijun_max をわずかに上回る → NG', () => {
    expect(ok('220.101')).toEqual({ valid: true, hantei: 'NG' });
  });

  it('(kijun_max - sunpou) == 0.010 ちょうど → OK (LT 比較なので境界は再検査にしない)', () => {
    expect(ok('220.090')).toEqual({ valid: true, hantei: 'OK' });
  });

  it('(kijun_max - sunpou) == 0.009 → 再検査', () => {
    expect(ok('220.091')).toEqual({ valid: true, hantei: '再検査' });
  });

  it('範囲中央の値 → OK', () => {
    expect(ok('220.000')).toEqual({ valid: true, hantei: 'OK' });
  });

  it('浮動小数点誤差が出やすい組合せでも 0.010 ちょうどは OK', () => {
    // 0.3 - 0.29 は double では 0.010000000000000009 になる
    expect(svc.judge('0.29', '0.1', '0.3')).toEqual({
      valid: true,
      hantei: 'OK',
    });
    expect(svc.judge(220.09, 219.9, 220.1)).toEqual({
      valid: true,
      hantei: 'OK',
    });
  });

  describe('非数値 → バリデーションエラー', () => {
    it.each(['', '   ', 'abc', '220.0.0', '22O.000', null, undefined, {}])(
      'sunpou=%p',
      (v) => {
        expect(svc.judge(v as string, '219.900', '220.100')).toEqual({
          valid: false,
          message: INVALID_SUNPOU_MESSAGE,
        });
      },
    );
    it('kijun_* が非数値でもエラー', () => {
      expect(svc.judge('220.000', 'x', '220.100').valid).toBe(false);
      expect(svc.judge('220.000', '219.900', '').valid).toBe(false);
    });
    it('前後の空白・符号・数値型は許容', () => {
      expect(ok(' 220.000 ')).toEqual({ valid: true, hantei: 'OK' });
      expect(ok('+220.000')).toEqual({ valid: true, hantei: 'OK' });
      expect(svc.judge(220, 219.9, 220.1)).toEqual({
        valid: true,
        hantei: 'OK',
      });
    });
  });

  describe('db/02_seed.sql の既存データと整合', () => {
    it.each([
      ['219.985', '219.900', '220.100', 'OK'],
      ['220.140', '219.900', '220.100', 'NG'],
      ['220.010', '219.900', '220.100', 'OK'],
      ['150.320', '150.000', '150.500', 'OK'],
      ['150.620', '150.000', '150.500', 'NG'],
      ['45.020', '44.950', '45.050', 'OK'],
      ['100.780', '100.000', '100.500', 'NG'],
      ['100.610', '100.000', '100.500', 'NG'],
      ['44.980', '44.950', '45.050', 'OK'],
      ['45.030', '44.950', '45.050', 'OK'],
      ['45.070', '44.950', '45.050', 'NG'],
    ])('%s / %s-%s → %s', (s, min, max, expected) => {
      expect(svc.judge(s, min, max)).toEqual({ valid: true, hantei: expected });
    });

    it('LOT-D403 (100.310/100.000/100.500) は seed 上「再検査」だが、規則上は OK (差 0.190)', () => {
      // seed の 再検査 は現場が手入力した値。判定ロジックの結果とは一致しない旨をドキュメントに明記
      expect(svc.judge('100.310', '100.000', '100.500')).toEqual({
        valid: true,
        hantei: 'OK',
      });
    });
  });
});
