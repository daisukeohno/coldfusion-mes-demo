import { BadRequestException, Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import {
  InvalidSortColumnError,
  LINE_LIST,
  OrdersJudgmentService,
  STATUS_LIST,
} from './orders-judgment.service';
import {
  OrderListQuery,
  OrderListResult,
  OrderListRow,
  OrderRow,
  OrderSearchOptions,
} from './orders.dto';

const SELECT_SQL = `select s.shiji_no, s.hinmoku_cd, h.hinmoku_nm, s.line_cd, s.suryo,
    s.kanryo_suryo, s.furyo_suryo, s.noki_ymd, s.status, s.tokui_nm, s.bikou
  from t_seizou_shiji s
  join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd`;

const KEYWORD_CONDITION =
  '(s.shiji_no like ? or h.hinmoku_nm like ? or s.tokui_nm like ?)';

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly judgment: OrdersJudgmentService,
  ) {}

  /** 状態・ライン プルダウンの選択肢 (app/orders.cfm と同じ値・順序) */
  searchOptions(): OrderSearchOptions {
    return { statusList: [...STATUS_LIST], lineList: [...LINE_LIST] };
  }

  /**
   * 製造指示一覧。app/orders.cfm の SQL・絞込条件・並び順をそのまま保持し、
   * 動的値は全てプレースホルダにバインドする。
   */
  async findAll(query: OrderListQuery): Promise<OrderListResult> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    // CFML は len(trim(kw)) で判定しつつ LIKE には未 trim の値を埋めていたため、同じ挙動にする
    const kw = query.kw ?? '';
    if (kw.trim().length > 0) {
      conditions.push(KEYWORD_CONDITION);
      const like = `%${kw}%`;
      params.push(like, like, like);
    }
    const status = query.status ?? '';
    if (status.length > 0) {
      conditions.push('s.status = ?');
      params.push(status);
    }
    const line = query.line ?? '';
    if (line.length > 0) {
      conditions.push('s.line_cd = ?');
      params.push(line);
    }

    let sort: string;
    try {
      sort = this.judgment.resolveSortColumn(query.sort);
    } catch (error) {
      if (error instanceof InvalidSortColumnError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const where = conditions.length > 0 ? ` and ${conditions.join(' and ')}` : '';
    const sql = `${SELECT_SQL}${where} order by s.${sort}`;

    const [dateRow] = await this.db.query<{ today: string } & RowDataPacket>(
      'select date_format(curdate(), \'%Y-%m-%d\') as today',
    );
    // 納期遅れ判定の基準日は CFML の now() と同様にサーバ側 (DB) で取得する
    const today = dateRow?.today ?? '';

    const rows = await this.db.query<OrderRow & RowDataPacket>(sql, params);
    const list: OrderListRow[] = rows.map((row) => ({
      ...row,
      okure: this.judgment.isOkure(row.status, row.noki_ymd, today),
      rate: this.judgment.progressRate(row.kanryo_suryo, row.suryo),
    }));

    return { rows: list, recordCount: list.length, today, sort };
  }
}
