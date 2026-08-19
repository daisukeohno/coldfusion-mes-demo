import { OrderDetailSummaryService } from './order-detail-summary.service';

describe('OrderDetailSummaryService', () => {
  const service = new OrderDetailSummaryService();

  describe('rate', () => {
    it.each([
      [0, 0, 0],
      [3, 0, 0],
      [3, 1, 33],
      [3, 2, 66],
      [100, 99, 99],
      [100, 100, 100],
    ])('suryo=%i / kanryo_suryo=%i は rate=%i', (suryo, kanryo, expected) => {
      expect(service.calculate({ suryo, kanryo_suryo: kanryo, hyojun_jikan: '1.00' }).rate).toBe(
        expected,
      );
    });

    it('浮動小数点誤差が出る 23 / 20 でも 115% を返す', () => {
      expect(Math.trunc((23 / 20) * 100)).toBe(114);
      expect(
        service.calculate({ suryo: 20, kanryo_suryo: 23, hyojun_jikan: '1.00' }).rate,
      ).toBe(115);
    });
  });

  describe('zan', () => {
    it('完了数が指示数と同じなら 0', () => {
      expect(service.calculate({ suryo: 10, kanryo_suryo: 10, hyojun_jikan: '1.00' }).zan).toBe(0);
    });

    it('完了数が指示数を超えた場合は負数', () => {
      expect(service.calculate({ suryo: 10, kanryo_suryo: 12, hyojun_jikan: '1.00' }).zan).toBe(-2);
    });
  });

  describe('yotei_kosu', () => {
    it('標準工数の小数2桁を維持して計算する', () => {
      expect(
        service.calculate({ suryo: 7, kanryo_suryo: 0, hyojun_jikan: '48.50' }).yotei_kosu,
      ).toBe(339.5);
    });

    it('小数 .5 の境界を丸めず計算結果として保持する', () => {
      expect(
        service.calculate({ suryo: 3, kanryo_suryo: 0, hyojun_jikan: '0.50' }).yotei_kosu,
      ).toBe(1.5);
    });

    it('標準工数が null の場合は null', () => {
      expect(
        service.calculate({ suryo: 3, kanryo_suryo: 0, hyojun_jikan: null }).yotei_kosu,
      ).toBeNull();
    });
  });
});
