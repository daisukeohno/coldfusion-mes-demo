import { BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OrdersJudgmentService } from './orders-judgment.service';
import { OrdersService } from './orders.service';

type QueryCall = { sql: string; params: unknown[] };

describe('OrdersService', () => {
  let calls: QueryCall[];
  let rows: Record<string, unknown>[];
  let db: DatabaseService;
  let service: OrdersService;

  beforeEach(() => {
    calls = [];
    rows = [];
    db = {
      query: jest.fn((sql: string, params: unknown[] = []) => {
        calls.push({ sql, params });
        if (sql.includes('curdate()')) {
          return Promise.resolve([{ today: '2026-08-19' }]);
        }
        return Promise.resolve(rows);
      }),
      insert: jest.fn(() => Promise.resolve({ insertId: 0, affectedRows: 0 })),
    } as unknown as DatabaseService;
    service = new OrdersService(db, new OrdersJudgmentService());
  });

  const listCall = (): QueryCall => {
    const call = calls.find((c) => c.sql.includes('from t_seizou_shiji'));
    if (call === undefined) {
      throw new Error('一覧 SQL が実行されていない');
    }
    return call;
  };

  it('条件なしは全件・納期昇順、動的値のバインドは無し', async () => {
    await service.findAll({});
    const { sql, params } = listCall();
    expect(sql).toContain('join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd');
    expect(sql).not.toContain('where s.hinmoku_cd');
    expect(sql).toContain(
      'select s.shiji_no, s.hinmoku_cd, h.hinmoku_nm, s.line_cd, s.suryo',
    );
    expect(sql.trimEnd().endsWith('order by s.noki_ymd')).toBe(true);
    expect(params).toEqual([]);
  });

  it('キーワードは 3 列の LIKE をパラメータバインドする', async () => {
    await service.findAll({ kw: "A' or 1=1 --" });
    const { sql, params } = listCall();
    expect(sql).toContain('(s.shiji_no like ? or h.hinmoku_nm like ? or s.tokui_nm like ?)');
    expect(sql).not.toContain('1=1');
    expect(params).toEqual(["%A' or 1=1 --%", "%A' or 1=1 --%", "%A' or 1=1 --%"]);
  });

  it('空白のみのキーワードは条件にしない (len(trim(kw)) と同じ)', async () => {
    await service.findAll({ kw: '   ' });
    expect(listCall().params).toEqual([]);
  });

  it('キーワードは trim せずに LIKE へ渡す (CFML と同じ)', async () => {
    await service.findAll({ kw: ' 精密 ' });
    expect(listCall().params).toEqual(['% 精密 %', '% 精密 %', '% 精密 %']);
  });

  it('状態・ラインの絞込を AND で追加する', async () => {
    await service.findAll({ status: '作業中', line: 'L-02' });
    const { sql, params } = listCall();
    expect(sql).toContain('s.status = ?');
    expect(sql).toContain('s.line_cd = ?');
    expect(params).toEqual(['作業中', 'L-02']);
  });

  it('キーワード・状態・ラインを同時指定できる (条件の順序も CFML と同じ)', async () => {
    await service.findAll({ kw: 'SJ', status: '完了', line: 'L-01' });
    expect(listCall().params).toEqual(['%SJ%', '%SJ%', '%SJ%', '完了', 'L-01']);
  });

  it('sort に許可列以外を指定すると 400 で、SQL は実行されない', async () => {
    await expect(service.findAll({ sort: 'noki_ymd; drop table t_seizou_shiji' })).rejects.toThrow(
      BadRequestException,
    );
    expect(calls).toEqual([]);
  });

  it('sort=shiji_no は order by s.shiji_no になる', async () => {
    await service.findAll({ sort: 'shiji_no' });
    expect(listCall().sql.trimEnd().endsWith('order by s.shiji_no')).toBe(true);
  });

  it('参照のみで INSERT / UPDATE は行わない', async () => {
    await service.findAll({ kw: 'SJ', status: '作業中', line: 'L-01', sort: 'shiji_no' });
    expect(db.insert).not.toHaveBeenCalled();
    for (const call of calls) {
      expect(call.sql).not.toMatch(/insert|update|delete/i);
    }
  });

  it('各行に納期遅れ・進捗率を付与し件数を返す', async () => {
    rows = [
      {
        shiji_no: 'SJ-1',
        hinmoku_cd: 'H-1',
        hinmoku_nm: '品目1',
        line_cd: 'L-01',
        suryo: 3,
        kanryo_suryo: 1,
        furyo_suryo: 0,
        noki_ymd: '2026-08-18',
        status: '作業中',
        tokui_nm: '得意先',
        bikou: '',
      },
      {
        shiji_no: 'SJ-2',
        hinmoku_cd: 'H-2',
        hinmoku_nm: '品目2',
        line_cd: 'L-02',
        suryo: 100,
        kanryo_suryo: 100,
        furyo_suryo: 2,
        noki_ymd: '2026-08-18',
        status: '完了',
        tokui_nm: '得意先',
        bikou: '',
      },
      {
        shiji_no: 'SJ-3',
        hinmoku_cd: 'H-3',
        hinmoku_nm: '品目3',
        line_cd: 'L-03',
        suryo: 0,
        kanryo_suryo: 0,
        furyo_suryo: 0,
        noki_ymd: '2026-08-19',
        status: '未着手',
        tokui_nm: '得意先',
        bikou: '',
      },
    ];
    const result = await service.findAll({});
    expect(result.recordCount).toBe(3);
    expect(result.today).toBe('2026-08-19');
    expect(result.sort).toBe('noki_ymd');
    expect(result.rows.map((r) => r.okure)).toEqual([true, false, false]);
    expect(result.rows.map((r) => r.rate)).toEqual([33, 100, 0]);
  });

  it('判定基準日はサーバ側 (DB の curdate()) から取得する', async () => {
    await service.findAll({});
    expect(calls.some((c) => c.sql.includes('curdate()'))).toBe(true);
  });

  it('状態・ラインの選択肢は CFML と同じ値・順序', () => {
    expect(service.searchOptions()).toEqual({
      statusList: ['未着手', '作業中', '完了', '保留'],
      lineList: ['L-01', 'L-02', 'L-03', 'L-04'],
    });
  });
});
