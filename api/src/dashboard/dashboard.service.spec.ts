import { DatabaseService } from '../database/database.service';
import { DashboardMetricsService } from './dashboard-metrics.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let db: { query: jest.Mock; insert: jest.Mock };
  let service: DashboardService;

  const rowsBySql = (sql: string): unknown[] => {
    if (sql.includes('curdate()') && sql.includes('as today')) {
      return [{ today: '2026-08-19' }];
    }
    if (sql.includes('group by status')) {
      return [
        { status: '作業中', ken: 7, suryo: '1440', kanryo: '718', furyo: '18' },
        { status: '保留', ken: 1, suryo: '100', kanryo: '55', furyo: '9' },
        { status: '完了', ken: 3, suryo: '670', kanryo: '670', furyo: '16' },
        { status: '未着手', ken: 3, suryo: '310', kanryo: null, furyo: null },
      ];
    }
    if (sql.includes('group by line_cd')) {
      return [
        { line_cd: 'L-01', suryo: '480', kanryo: '202', furyo: '15' },
        { line_cd: 'L-02', suryo: '680', kanryo: '288', furyo: '7' },
      ];
    }
    if (sql.includes('from t_seizou_shiji s')) {
      return [
        {
          shiji_no: 'SJ-2608-0004',
          hinmoku_cd: 'PMP-1001',
          hinmoku_nm: 'ポンプケーシング 150A',
          line_cd: 'L-01',
          suryo: 80,
          kanryo_suryo: 42,
          noki_ymd: '2026-08-18',
          tokui_nm: '東海水道機工(株)',
        },
        {
          shiji_no: 'SJ-2608-0009',
          hinmoku_cd: 'PMP-1000',
          hinmoku_nm: 'ポンプケーシング 100A',
          line_cd: 'L-01',
          suryo: 100,
          kanryo_suryo: 55,
          noki_ymd: '2026-08-17',
          tokui_nm: '四国上下水道',
        },
      ];
    }
    if (sql.includes('from t_kensa')) {
      return [
        { hantei: 'NG', ken: 4 },
        { hantei: 'OK', ken: 11 },
        { hantei: '再検査', ken: 2 },
      ];
    }
    if (sql.includes('from t_hozen')) {
      return [
        {
          setsubi_cd: 'LT-201',
          setsubi_nm: 'NC旋盤 φ500',
          shubetsu: '故障修理',
          hassei_ymd: '2026-08-15',
          naiyo: '主軸異音',
        },
      ];
    }
    if (sql.includes('from t_zaiko')) {
      return [
        { buhin_cd: 'BLT-M12', buhin_nm: 'ボルト M12', souko_cd: 'W1', zaiko_su: 40, hacchu_ten: 120 },
        { buhin_cd: 'SEL-45', buhin_nm: 'シール 45A', souko_cd: 'W2', zaiko_su: 95, hacchu_ten: 100 },
      ];
    }
    throw new Error(`unexpected sql: ${sql}`);
  };

  beforeEach(() => {
    db = {
      query: jest.fn((sql: string) => Promise.resolve(rowsBySql(sql))),
      insert: jest.fn(),
    };
    service = new DashboardService(
      db as unknown as DatabaseService,
      new DashboardMetricsService(),
    );
  });

  it('KPI は状態別集計の全行合計と納期遅れ件数から算出する', async () => {
    const result = await service.summary();

    expect(result.as_of).toBe('2026-08-19');
    expect(result.kpi).toEqual({
      total_ken: 14,
      total_suryo: 2520,
      total_kanryo: 1443,
      total_furyo: 43,
      // 43 / 2520 * 100 = 1.7063... -> 1.71
      furyo_rate: '1.71',
      okure_ken: 2,
    });
  });

  it('状態別集計は進捗率付きで、順序と NULL 合計を保持する', async () => {
    const result = await service.summary();

    expect(result.status_summary.map((row) => row.status)).toEqual([
      '作業中',
      '保留',
      '完了',
      '未着手',
    ]);
    expect(result.status_summary[0].rate).toBe(49); // 718/1440 = 49.86 -> 49
    expect(result.status_summary[2].rate).toBe(100);
    expect(result.status_summary[3]).toEqual({
      status: '未着手',
      ken: 3,
      suryo: 310,
      kanryo: 0,
      furyo: 0,
      rate: 0,
    });
  });

  it('ライン別は残数を計算し、発注点割れは不足数を計算する', async () => {
    const result = await service.summary();

    expect(result.line_summary[0]).toEqual({
      line_cd: 'L-01',
      suryo: 480,
      kanryo: 202,
      furyo: 15,
      zan: 278,
    });
    expect(result.reorder_alerts.map((row) => row.fusoku)).toEqual([80, 5]);
  });

  it('納期遅れ・未復旧保全・検査判定はクエリの並び順のまま返す', async () => {
    const result = await service.summary();

    expect(result.overdue_orders.map((row) => row.shiji_no)).toEqual([
      'SJ-2608-0004',
      'SJ-2608-0009',
    ]);
    expect(result.open_maintenance).toEqual([
      {
        setsubi_cd: 'LT-201',
        setsubi_nm: 'NC旋盤 φ500',
        shubetsu: '故障修理',
        hassei_ymd: '2026-08-15',
        naiyo: '主軸異音',
      },
    ]);
    expect(result.judgment_summary.map((row) => row.hantei)).toEqual(['NG', 'OK', '再検査']);
  });

  it('納期遅れは厳密不等号・未完了条件を SQL 側で保持し、基準日は DB から取得する', async () => {
    await service.summary();

    const overdueSql = db.query.mock.calls
      .map(([sql]) => sql as string)
      .find((sql) => sql.includes('from t_seizou_shiji s'));
    expect(overdueSql).toContain("s.status <> '完了'");
    expect(overdueSql).toContain('s.noki_ymd < curdate()');
    expect(overdueSql).toContain('order by s.noki_ymd');
    expect(overdueSql).toContain('join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd');
  });

  it('参照専用画面なので DB への書き込みは行わない', async () => {
    await service.summary();

    expect(db.insert).not.toHaveBeenCalled();
    for (const [sql] of db.query.mock.calls) {
      expect(String(sql)).toMatch(/^select /);
    }
  });

  it('データが 0 件でも KPI は 0 で返す (不良率の 0 除算なし)', async () => {
    db.query.mockImplementation((sql: string) =>
      Promise.resolve(sql.includes('as today') ? [{ today: '2026-08-19' }] : []),
    );

    const result = await service.summary();

    expect(result.kpi).toEqual({
      total_ken: 0,
      total_suryo: 0,
      total_kanryo: 0,
      total_furyo: 0,
      furyo_rate: '0.00',
      okure_ken: 0,
    });
    expect(result.overdue_orders).toEqual([]);
    expect(result.reorder_alerts).toEqual([]);
  });
});
