import { Injectable } from '@nestjs/common';

/** t_seizou_shiji.status の運用値 (app/orders.cfm の状態プルダウンと同じ順序) */
export const STATUS_LIST = ['未着手', '作業中', '完了', '保留'] as const;

/** app/Application.cfc の application.LINE_LIST */
export const LINE_LIST = ['L-01', 'L-02', 'L-03', 'L-04'] as const;

/** app/orders.cfm の order by に指定できる t_seizou_shiji の列 */
export const SORTABLE_COLUMNS = [
  'shiji_no',
  'hinmoku_cd',
  'line_cd',
  'suryo',
  'kanryo_suryo',
  'furyo_suryo',
  'noki_ymd',
  'status',
  'tokui_nm',
  'bikou',
  'toroku_ymd',
] as const;

export type SortColumn = (typeof SORTABLE_COLUMNS)[number];

export const DEFAULT_SORT: SortColumn = 'noki_ymd';

export class InvalidSortColumnError extends Error {
  constructor() {
    super('並び順に指定できない項目です。');
    this.name = 'InvalidSortColumnError';
  }
}

/** 'YYYY-MM-DD' 形式の日付文字列のみを受け付ける */
function toYmd(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const ymd = value.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : null;
}

@Injectable()
export class OrdersJudgmentService {
  /**
   * app/orders.cfm の納期遅れ判定。
   *
   *   okure = ( status NEQ "完了" AND dateCompare(noki_ymd, now(), "d") LT 0 )
   *
   * 「完了」以外で納期が当日より前 (当日は遅れではない) の場合に遅れとする。
   * 日付は 'YYYY-MM-DD' の文字列比較で行い、時刻・浮動小数点の影響を受けない。
   */
  isOkure(status: string | null | undefined, nokiYmd: unknown, today: string): boolean {
    if (status === '完了') {
      return false;
    }
    const noki = toYmd(nokiYmd);
    const base = toYmd(today);
    if (noki === null || base === null) {
      // 納期未設定の行は遅れとして扱わない (CFML では dateCompare が例外になっていた)
      return false;
    }
    return noki < base;
  }

  /**
   * app/orders.cfm の進捗率。
   *
   *   rate = suryo GT 0 ? int((kanryo_suryo / suryo) * 100) : 0
   *
   * 指示数・完了数はいずれも INT 列なので整数演算で切り捨てる。
   */
  progressRate(kanryoSuryo: unknown, suryo: unknown): number {
    const kanryo = Number(kanryoSuryo ?? 0);
    const total = Number(suryo ?? 0);
    if (!Number.isFinite(kanryo) || !Number.isFinite(total) || total <= 0) {
      return 0;
    }
    return Math.trunc((Math.trunc(kanryo) * 100) / Math.trunc(total));
  }

  /** order by へ埋め込む列名。CFML の文字列連結と違い許可列のみ受け付ける */
  resolveSortColumn(sort: string | undefined): SortColumn {
    if (sort === undefined || sort === null || sort === '') {
      return DEFAULT_SORT;
    }
    const found = SORTABLE_COLUMNS.find((column) => column === sort);
    if (found === undefined) {
      throw new InvalidSortColumnError();
    }
    return found;
  }
}
