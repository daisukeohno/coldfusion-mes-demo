import {
  MaintenanceJudgmentService,
  centiToDecimalString,
  toCenti,
  toDecimalString,
} from './maintenance-judgment.service';

describe('MaintenanceJudgmentService', () => {
  const service = new MaintenanceJudgmentService();
  const TODAY = '2026-08-19';

  describe('次回点検予定 / 期限超過 (dateCompare(nextYmd, now(), "d") LT 0)', () => {
    it('次回点検予定が当日ちょうどなら期限超過ではない', () => {
      // 2026-08-19 - 30日 = 2026-07-20
      const plan = service.plan({
        dounyu_ymd: '2018-04-01',
        tenken_cycle: 30,
        last_ymd: '2026-07-20',
        today: TODAY,
      });
      expect(plan.next_ymd).toBe('2026-08-19');
      expect(plan.okure).toBe(false);
    });

    it('次回点検予定が当日の1日前なら期限超過', () => {
      const plan = service.plan({
        dounyu_ymd: '2018-04-01',
        tenken_cycle: 30,
        last_ymd: '2026-07-19',
        today: TODAY,
      });
      expect(plan.next_ymd).toBe('2026-08-18');
      expect(plan.okure).toBe(true);
    });

    it('次回点検予定が当日の1日後なら期限超過ではない', () => {
      const plan = service.plan({
        dounyu_ymd: '2018-04-01',
        tenken_cycle: 30,
        last_ymd: '2026-07-21',
        today: TODAY,
      });
      expect(plan.next_ymd).toBe('2026-08-20');
      expect(plan.okure).toBe(false);
    });

    it('定期点検の記録がない設備は次回予定なし・期限超過扱い', () => {
      const plan = service.plan({
        dounyu_ymd: '2018-04-01',
        tenken_cycle: 30,
        last_ymd: null,
        today: TODAY,
      });
      expect(plan.next_ymd).toBeNull();
      expect(plan.okure).toBe(true);
    });

    it('点検周期 0 日は最終点検日そのものが次回予定になる', () => {
      expect(
        service.plan({ dounyu_ymd: '2018-04-01', tenken_cycle: 0, last_ymd: TODAY, today: TODAY }),
      ).toMatchObject({ next_ymd: TODAY, okure: false });
      expect(
        service.plan({
          dounyu_ymd: '2018-04-01',
          tenken_cycle: 0,
          last_ymd: '2026-08-18',
          today: TODAY,
        }),
      ).toMatchObject({ next_ymd: '2026-08-18', okure: true });
    });

    it('月末・うるう年をまたぐ日数加算でもカレンダー通りに進む', () => {
      expect(
        service.plan({
          dounyu_ymd: '2018-04-01',
          tenken_cycle: 1,
          last_ymd: '2028-02-28',
          today: TODAY,
        }).next_ymd,
      ).toBe('2028-02-29');
      expect(
        service.plan({
          dounyu_ymd: '2018-04-01',
          tenken_cycle: 30,
          last_ymd: '2026-12-31',
          today: TODAY,
        }).next_ymd,
      ).toBe('2027-01-30');
    });

    it('点検周期が数値でない場合は記録なしと同じ扱い', () => {
      expect(
        service.plan({ dounyu_ymd: '2018-04-01', tenken_cycle: null, last_ymd: TODAY, today: TODAY }),
      ).toMatchObject({ next_ymd: null, okure: true });
    });

    it('DATETIME 文字列や Date でも日付部分だけで判定する', () => {
      const plan = service.plan({
        dounyu_ymd: new Date(2018, 3, 1),
        tenken_cycle: 30,
        last_ymd: '2026-07-20 13:45:00',
        today: '2026-08-19 23:59:59',
      });
      expect(plan.next_ymd).toBe('2026-08-19');
      expect(plan.okure).toBe(false);
    });
  });

  describe('経過年数 int(dateDiff("d", dounyu_ymd, now()) / 365)', () => {
    it.each<[string, number]>([
      ['2025-08-20', 0], // 364日
      ['2025-08-19', 1], // 365日ちょうど
      ['2024-08-20', 1], // 729日
      ['2024-08-19', 2], // 730日
      ['2026-08-19', 0], // 当日導入
    ])('導入日 %s の経過年数は %i 年', (dounyu, expected) => {
      expect(
        service.plan({ dounyu_ymd: dounyu, tenken_cycle: 30, last_ymd: TODAY, today: TODAY }).keika,
      ).toBe(expected);
    });
  });

  describe('状態 (qOpen.ken GT 0)', () => {
    it('未復旧 0 件は稼働、1 件以上は稼働ではない', () => {
      expect(service.isKadou(0)).toBe(true);
      expect(service.isKadou(1)).toBe(false);
      expect(service.isKadou('2')).toBe(false);
      expect(service.isKadou(null)).toBe(true);
    });
  });

  describe('toCenti (DECIMAL(8,2) 相当の整数化)', () => {
    it.each<[unknown, number | null]>([
      ['2.50', 250],
      ['2.5', 250],
      ['2', 200],
      ['.5', 50],
      ['+2.5', 250],
      ['-1.25', -125],
      ['0.004', 0],
      ['0.005', 1],
      ['999999.99', 99999999],
      [2.5, 250],
      [0.1 + 0.2, 30],
      ['', null],
      ['abc', null],
      ['1e2', null],
      ['２.５', null],
      [null, null],
      [undefined, null],
      [NaN, null],
    ])('toCenti(%p) === %p', (input, expected) => {
      expect(toCenti(input)).toBe(expected);
    });

    it('数値型と文字列型で丸め結果が一致する', () => {
      expect(toCenti(1.005)).toBe(toCenti('1.005'));
      expect(toCenti(-1.234)).toBe(toCenti('-1.234'));
    });

    it('停止時間の合計は整数化すれば浮動小数点誤差が出ない', () => {
      expect(0.1 + 0.2 === 0.3).toBe(false);
      const total = ['0.10', '0.20'].reduce((sum, v) => sum + (toCenti(v) ?? 0), 0);
      expect(centiToDecimalString(total)).toBe('0.30');
    });
  });

  describe('toDecimalString', () => {
    it.each<[unknown, string | null]>([
      [' 2.5 ', '2.50'],
      ['+2.5', '2.50'],
      ['2.', '2.00'],
      ['.5', '0.50'],
      [2.5, '2.50'],
      ['-1.25', '-1.25'],
      ['abc', null],
    ])('toDecimalString(%p) === %p', (input, expected) => {
      expect(toDecimalString(input)).toBe(expected);
    });
  });
});
