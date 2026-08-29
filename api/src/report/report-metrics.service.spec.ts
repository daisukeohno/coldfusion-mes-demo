import {
  isFuryoRateNg,
  percentString,
  ReportMetricsService,
  toInt,
} from './report-metrics.service';

describe('ReportMetricsService', () => {
  const service = new ReportMetricsService();

  describe('不良率の赤字判定 (fRate GTE 3)', () => {
    it.each<[number, number, boolean]>([
      [2, 100, false], // 2.00% は閾値未満
      [3, 100, true], // 3.00% は閾値ちょうどなので赤字
      [4, 100, true],
      [29, 1000, false], // 2.9% は閾値未満
      [30, 1000, true], // 3.0% ちょうど
      [299, 10000, false], // 2.99% (最小単位で閾値未満)
      [300, 10000, true],
      [1, 34, false], // 2.941...% は閾値未満
      [1, 33, true], // 3.030...% は閾値以上
    ])('furyo=%p / kanryo=%p → NG=%p', (furyo, kanryo, expected) => {
      expect(isFuryoRateNg(furyo, kanryo)).toBe(expected);
    });

    it('完了数 0 のときは不良数があっても不良率 0 で赤字にしない', () => {
      expect(isFuryoRateNg(5, 0)).toBe(false);
      expect(service.lineRow({ line_cd: 'L-09', ken: 1, suryo: 100, kanryo: 0, furyo: 5 })).toEqual(
        expect.objectContaining({ furyo_rate: '0.00', furyo_rate_ng: false, tassei_rate: '0.0' }),
      );
    });

    it('割り切れない比率でも整数比較で閾値の前後が安定する', () => {
      // 2.9999...% と 3.0000...% を最小単位で挟む
      expect(isFuryoRateNg(299999, 10000000)).toBe(false);
      expect(isFuryoRateNg(300000, 10000000)).toBe(true);
      // 表示は四捨五入で 3.00% でも、閾値未満なら赤字にしない
      expect(percentString(29999, 1000000, 2)).toBe('3.00');
      expect(isFuryoRateNg(29999, 1000000)).toBe(false);
    });
  });

  describe('percentString (numberFormat 相当の四捨五入)', () => {
    it.each<[number, number, number, string]>([
      [0, 0, 2, '0.00'], // 分母 0 は 0
      [0, 100, 2, '0.00'],
      [1, 3, 2, '33.33'], // 33.333...% 切り捨て側
      [2, 3, 2, '66.67'], // 66.666...% 繰り上げ側
      [1, 8, 2, '12.50'],
      [1, 16, 2, '6.25'],
      [1, 160, 2, '0.63'], // 0.625% は四捨五入で 0.63
      [7, 1600, 2, '0.44'], // 0.4375% は 0.44
      [1, 1, 2, '100.00'],
      [3, 2, 1, '150.0'], // 完了数が指示数を超える場合も表示する
      [1, 3, 1, '33.3'],
      [2, 3, 1, '66.7'],
      [1, 6, 1, '16.7'], // 16.666...%
      [5, 1000, 1, '0.5'],
      [1, 1000, 1, '0.1'],
    ])('percentString(%p, %p, %p) === %p', (bunshi, bunbo, scale, expected) => {
      expect(percentString(bunshi, bunbo, scale)).toBe(expected);
    });

    it('倍精度の toFixed と結果が異なる値でも十進の四捨五入になる', () => {
      // 1.005 は倍精度では 1.00499999... のため toFixed(2) が '1.00' になる
      expect(((1 / 100) * 100).toFixed(2)).toBe('1.00');
      expect(percentString(201, 20000, 2)).toBe('1.01'); // 1.005% → 1.01
      expect(percentString(101, 200, 1)).toBe('50.5');
    });
  });

  describe('toInt (sum() の NULL を 0 として扱う)', () => {
    it.each<[unknown, number]>([
      ['120', 120],
      [120, 120],
      ['0', 0],
      ['-5', -5],
      [null, 0],
      [undefined, 0],
      ['', 0],
      ['abc', 0],
      ['12.0', 12],
    ])('toInt(%p) === %p', (input, expected) => {
      expect(toInt(input)).toBe(expected);
    });
  });

  describe('lineRow', () => {
    it('不良率は完了数ベース、達成率は指示数ベースで算出する', () => {
      expect(
        service.lineRow({ line_cd: 'L-01', ken: '3', suryo: '1000', kanryo: '400', furyo: '12' }),
      ).toEqual({
        line_cd: 'L-01',
        ken: 3,
        suryo: 1000,
        kanryo: 400,
        furyo: 12,
        furyo_rate: '3.00',
        furyo_rate_ng: true,
        tassei_rate: '40.0',
      });
    });

    it('指示数 0 のときは達成率 0', () => {
      expect(
        service.lineRow({ line_cd: 'L-02', ken: 1, suryo: 0, kanryo: 0, furyo: 0 }),
      ).toEqual(
        expect.objectContaining({ tassei_rate: '0.0', furyo_rate: '0.00', furyo_rate_ng: false }),
      );
    });
  });

  describe('okureRow', () => {
    it('残数は指示数 - 完了数', () => {
      expect(
        service.okureRow({
          shiji_no: 'SJ-2608-0001',
          hinmoku_nm: 'ギア',
          noki_ymd: '2026-08-01',
          suryo: '500',
          kanryo_suryo: '120',
          tokui_nm: '東京商事',
        }),
      ).toEqual({
        shiji_no: 'SJ-2608-0001',
        hinmoku_nm: 'ギア',
        noki_ymd: '2026-08-01',
        suryo: 500,
        kanryo_suryo: 120,
        zansu: 380,
        tokui_nm: '東京商事',
      });
    });

    it('完了数が指示数を超える場合は負の残数をそのまま返す', () => {
      expect(
        service.okureRow({
          shiji_no: 'SJ-2608-0002',
          hinmoku_nm: 'シャフト',
          noki_ymd: '2026-08-02',
          suryo: 100,
          kanryo_suryo: 105,
          tokui_nm: '大阪工業',
        }).zansu,
      ).toBe(-5);
    });
  });

  describe('koteiRow / sagyoushaRow', () => {
    it('NULL の合計値は 0 になる', () => {
      expect(service.koteiRow({ kotei_nm: '塗装', ken: '2', yoryo: null, furyo: null })).toEqual({
        kotei_nm: '塗装',
        ken: 2,
        yoryo: 0,
        furyo: 0,
      });
      expect(
        service.sagyoushaRow({ sagyousha: '山田 太郎', ken: '4', yoryo: '80', furyo: '2' }),
      ).toEqual({ sagyousha: '山田 太郎', ken: 4, yoryo: 80, furyo: 2 });
    });
  });
});
