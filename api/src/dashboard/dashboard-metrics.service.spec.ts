import { DashboardMetricsService, toCount } from './dashboard-metrics.service';
import { StatusSummaryRow } from './dashboard.dto';

function statusRow(partial: Partial<StatusSummaryRow>): StatusSummaryRow {
  return { status: '作業中', ken: 0, suryo: 0, kanryo: 0, furyo: 0, rate: 0, ...partial };
}

describe('DashboardMetricsService', () => {
  const metrics = new DashboardMetricsService();

  describe('toCount', () => {
    it('mysql2 が文字列で返す SUM() を整数化する', () => {
      expect(toCount('2420')).toBe(2420);
      expect(toCount('2420.0000')).toBe(2420);
      expect(toCount(2420)).toBe(2420);
    });

    it('NULL / 空文字は 0 として扱う (CFML の空文字加算と同じ結果)', () => {
      expect(toCount(null)).toBe(0);
      expect(toCount(undefined)).toBe(0);
      expect(toCount('')).toBe(0);
    });

    it('数値以外は 0 として扱う', () => {
      expect(toCount('あ')).toBe(0);
      expect(toCount({})).toBe(0);
    });
  });

  describe('totals', () => {
    it('状態別集計の全行 (完了含む) を合計する', () => {
      const totals = metrics.totals([
        statusRow({ status: '作業中', ken: 2, suryo: 200, kanryo: 100, furyo: 3 }),
        statusRow({ status: '完了', ken: 1, suryo: 120, kanryo: 120, furyo: 3 }),
        statusRow({ status: '未着手', ken: 1, suryo: 180, kanryo: 0, furyo: 0 }),
      ]);

      expect(totals).toEqual({
        total_ken: 4,
        total_suryo: 500,
        total_kanryo: 220,
        total_furyo: 6,
      });
    });

    it('0 件のときは全て 0', () => {
      expect(metrics.totals([])).toEqual({
        total_ken: 0,
        total_suryo: 0,
        total_kanryo: 0,
        total_furyo: 0,
      });
    });
  });

  describe('furyoRate (指示数ベース / 小数2桁)', () => {
    it('指示数 0 のとき (境界: totalSuryo GT 0 が偽) は 0.00', () => {
      expect(metrics.furyoRate(0, 0)).toBe('0.00');
      expect(metrics.furyoRate(5, 0)).toBe('0.00');
    });

    it('指示数 1 (境界: totalSuryo GT 0 が真の最小値) で計算する', () => {
      expect(metrics.furyoRate(0, 1)).toBe('0.00');
      expect(metrics.furyoRate(1, 1)).toBe('100.00');
    });

    it('割り切れない値を小数2桁へ四捨五入する', () => {
      // 46 / 2620 * 100 = 1.7557...
      expect(metrics.furyoRate(46, 2620)).toBe('1.76');
      // 1 / 3 * 100 = 33.333...
      expect(metrics.furyoRate(1, 3)).toBe('33.33');
      // 2 / 3 * 100 = 66.666...
      expect(metrics.furyoRate(2, 3)).toBe('66.67');
    });

    it('端数ちょうど 0.005 は切り上げ、直下は切り捨て', () => {
      // 1 / 8 * 100 = 12.5 -> 小数2桁では丸め不要
      expect(metrics.furyoRate(1, 8)).toBe('12.50');
      // 3 / 160 * 100 = 1.875 -> 1.88 (半数切り上げ)
      expect(metrics.furyoRate(3, 160)).toBe('1.88');
      // 7 / 1600 * 100 = 0.4375 -> 0.44
      expect(metrics.furyoRate(7, 1600)).toBe('0.44');
      // 7 / 16000 * 100 = 0.04375 -> 0.04 (0.005 未満は切り捨て)
      expect(metrics.furyoRate(7, 16000)).toBe('0.04');
    });

    it('浮動小数点で誤差の出る値でも小数2桁が変わらない', () => {
      // 0.29 * 100 = 28.999999999999996 (IEEE754) だが表示は 29.00
      expect(metrics.furyoRate(29, 100)).toBe('29.00');
      // 8.2 系: 41/500*100 = 8.200000000000001
      expect(metrics.furyoRate(41, 500)).toBe('8.20');
    });
  });

  describe('progressRate (int() 切り捨て)', () => {
    it('指示数 0 (境界) は 0 を返す', () => {
      expect(metrics.progressRate(0, 0)).toBe(0);
      expect(metrics.progressRate(10, 0)).toBe(0);
    });

    it('完了 0 / 完了 = 指示数 の境界', () => {
      expect(metrics.progressRate(0, 100)).toBe(0);
      expect(metrics.progressRate(100, 100)).toBe(100);
    });

    it('端数は切り捨てる (99% と 100% の境界)', () => {
      // 99/100 = 99%
      expect(metrics.progressRate(99, 100)).toBe(99);
      // 299/300 = 99.66% -> 99
      expect(metrics.progressRate(299, 300)).toBe(99);
      // 42/80 = 52.5% -> 52
      expect(metrics.progressRate(42, 80)).toBe(52);
      // 1/3 = 33.33% -> 33
      expect(metrics.progressRate(1, 3)).toBe(33);
    });

    it('浮動小数点誤差で 1% 下がらない', () => {
      // (168/200)*100 = 84.00000000000001, (29/58)*100 = 50
      expect(metrics.progressRate(168, 200)).toBe(84);
      expect(metrics.progressRate(29, 58)).toBe(50);
      expect(metrics.progressRate(41, 50)).toBe(82);
    });

    it('完了数が指示数を超える場合も CFML と同じく 100 超を返す', () => {
      expect(metrics.progressRate(101, 100)).toBe(101);
    });
  });
});
