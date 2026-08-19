import {
  DEFAULT_SORT,
  InvalidSortColumnError,
  OrdersJudgmentService,
} from './orders-judgment.service';

describe('OrdersJudgmentService', () => {
  const judgment = new OrdersJudgmentService();
  const today = '2026-08-19';

  describe('isOkure (納期遅れ判定の境界値)', () => {
    it('納期が当日の前日ちょうど (最小単位 -1 日) は遅れ', () => {
      expect(judgment.isOkure('作業中', '2026-08-18', today)).toBe(true);
    });

    it('納期が当日ちょうどは遅れではない (dateCompare LT 0 の厳密不等号)', () => {
      expect(judgment.isOkure('作業中', '2026-08-19', today)).toBe(false);
    });

    it('納期が翌日ちょうど (最小単位 +1 日) は遅れではない', () => {
      expect(judgment.isOkure('作業中', '2026-08-20', today)).toBe(false);
    });

    it('状態が完了なら納期を過ぎていても遅れではない', () => {
      expect(judgment.isOkure('完了', '2020-01-01', today)).toBe(false);
    });

    it('完了以外の全状態で納期超過は遅れ', () => {
      for (const status of ['未着手', '作業中', '保留']) {
        expect(judgment.isOkure(status, '2026-08-18', today)).toBe(true);
      }
    });

    it('納期に時刻が付いていても日付だけで比較する', () => {
      expect(judgment.isOkure('作業中', '2026-08-19 23:59:59', today)).toBe(false);
      expect(judgment.isOkure('作業中', '2026-08-18 00:00:00', today)).toBe(true);
    });

    it('月末・年末をまたぐ境界でも日付順で比較する', () => {
      expect(judgment.isOkure('作業中', '2025-12-31', '2026-01-01')).toBe(true);
      expect(judgment.isOkure('作業中', '2026-01-01', '2025-12-31')).toBe(false);
      expect(judgment.isOkure('作業中', '2026-07-31', '2026-08-01')).toBe(true);
    });

    it('納期が未設定・不正な値の行は遅れとして扱わない', () => {
      expect(judgment.isOkure('作業中', null, today)).toBe(false);
      expect(judgment.isOkure('作業中', '', today)).toBe(false);
      expect(judgment.isOkure('作業中', 'あ', today)).toBe(false);
      expect(judgment.isOkure('作業中', 20260818, today)).toBe(false);
    });
  });

  describe('progressRate (進捗率の境界値)', () => {
    it('指示数 0 は 0% (ゼロ除算しない)', () => {
      expect(judgment.progressRate(5, 0)).toBe(0);
      expect(judgment.progressRate(0, 0)).toBe(0);
    });

    it('完了数 0 は 0%、指示数と同数は 100%', () => {
      expect(judgment.progressRate(0, 100)).toBe(0);
      expect(judgment.progressRate(100, 100)).toBe(100);
    });

    it('int() と同じく小数を切り捨てる', () => {
      expect(judgment.progressRate(1, 3)).toBe(33);
      expect(judgment.progressRate(2, 3)).toBe(66);
      expect(judgment.progressRate(99, 100)).toBe(99);
      expect(judgment.progressRate(1, 100)).toBe(1);
    });

    it('1% 未満は 0% になる (切り捨ての境界)', () => {
      expect(judgment.progressRate(1, 101)).toBe(0);
      expect(judgment.progressRate(1, 100)).toBe(1);
    });

    it('浮動小数点誤差で 1% ずれない (整数演算)', () => {
      // 0.29 * 100 = 28.999999999999996 になる値で切り捨てが狂わないこと
      expect(judgment.progressRate(29, 100)).toBe(29);
      expect(judgment.progressRate(57, 100)).toBe(57);
      expect(judgment.progressRate(7, 700)).toBe(1);
      expect(judgment.progressRate(3, 300)).toBe(1);
      expect(judgment.progressRate(1, 1000000)).toBe(0);
    });

    it('完了数が指示数を超える場合は 100% を超えてそのまま計算する (CFML と同じ)', () => {
      expect(judgment.progressRate(150, 100)).toBe(150);
    });

    it('null / 非数値は 0% として扱う', () => {
      expect(judgment.progressRate(null, 100)).toBe(0);
      expect(judgment.progressRate(undefined, 100)).toBe(0);
      expect(judgment.progressRate(10, null)).toBe(0);
      expect(judgment.progressRate('あ', 100)).toBe(0);
    });
  });

  describe('resolveSortColumn', () => {
    it('未指定は noki_ymd', () => {
      expect(judgment.resolveSortColumn(undefined)).toBe(DEFAULT_SORT);
      expect(judgment.resolveSortColumn('')).toBe('noki_ymd');
    });

    it('画面のリンクで使う列を受け付ける', () => {
      expect(judgment.resolveSortColumn('shiji_no')).toBe('shiji_no');
      expect(judgment.resolveSortColumn('noki_ymd')).toBe('noki_ymd');
    });

    it('許可列以外は InvalidSortColumnError', () => {
      expect(() => judgment.resolveSortColumn('shiji_no; drop table t_seizou_shiji')).toThrow(
        InvalidSortColumnError,
      );
      expect(() => judgment.resolveSortColumn('hinmoku_nm')).toThrow(InvalidSortColumnError);
      expect(() => judgment.resolveSortColumn('1')).toThrow(InvalidSortColumnError);
    });
  });
});
