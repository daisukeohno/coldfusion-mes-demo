import { BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReportMetricsService } from './report-metrics.service';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let db: { query: jest.Mock; insert: jest.Mock };
  let service: ReportService;

  const sqlOf = (fragment: string): string => {
    const call = db.query.mock.calls.find(([sql]: [string]) => sql.includes(fragment));
    if (!call) {
      throw new Error(`SQL not found: ${fragment}`);
    }
    return call[0] as string;
  };

  beforeEach(() => {
    db = {
      insert: jest.fn(),
      query: jest.fn().mockImplementation((sql: string) => {
        if (sql.includes('curdate()') && sql.includes('output_ymd')) {
          return Promise.resolve([{ output_ymd: '2026-08-19' }]);
        }
        if (sql.includes('from t_seizou_shiji s\n  group by s.line_cd')) {
          return Promise.resolve([
            { line_cd: 'L-01', ken: '2', suryo: '1000', kanryo: '400', furyo: '12' },
            { line_cd: 'L-02', ken: '1', suryo: '500', kanryo: '300', furyo: '8' },
          ]);
        }
        if (sql.includes('group by j.kotei_nm')) {
          return Promise.resolve([{ kotei_nm: '塗装', ken: '2', yoryo: null, furyo: null }]);
        }
        if (sql.includes('group by j.sagyousha')) {
          return Promise.resolve([
            { sagyousha: '山田 太郎', ken: '3', yoryo: '90', furyo: '1' },
          ]);
        }
        if (sql.includes("s.status <> '完了'")) {
          return Promise.resolve([
            {
              shiji_no: 'SJ-2608-0001',
              hinmoku_nm: 'ギア',
              noki_ymd: '2026-08-01',
              suryo: '500',
              kanryo_suryo: '120',
              tokui_nm: '東京商事',
            },
          ]);
        }
        return Promise.resolve([]);
      }),
    };
    service = new ReportService(db as unknown as DatabaseService, new ReportMetricsService());
  });

  it('4 ブロックの集計を返し、DB は参照のみで更新しない', async () => {
    const report = await service.dailyReport({});

    expect(report.output_ymd).toBe('2026-08-19');
    expect(report.ymd).toBe('2026-08-19');
    expect(report.ymd_filter_applied).toBe(false);
    expect(report.lines).toEqual([
      {
        line_cd: 'L-01',
        ken: 2,
        suryo: 1000,
        kanryo: 400,
        furyo: 12,
        furyo_rate: '3.00',
        furyo_rate_ng: true,
        tassei_rate: '40.0',
      },
      {
        line_cd: 'L-02',
        ken: 1,
        suryo: 500,
        kanryo: 300,
        furyo: 8,
        furyo_rate: '2.67',
        furyo_rate_ng: false,
        tassei_rate: '60.0',
      },
    ]);
    expect(report.kotei).toEqual([{ kotei_nm: '塗装', ken: 2, yoryo: 0, furyo: 0 }]);
    expect(report.sagyousha).toEqual([
      { sagyousha: '山田 太郎', ken: 3, yoryo: 90, furyo: 1 },
    ]);
    expect(report.okure).toEqual([
      {
        shiji_no: 'SJ-2608-0001',
        hinmoku_nm: 'ギア',
        noki_ymd: '2026-08-01',
        suryo: 500,
        kanryo_suryo: 120,
        zansu: 380,
        tokui_nm: '東京商事',
      },
    ]);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('ライン別集計は status で絞り込まず line_cd 昇順', async () => {
    await service.dailyReport({});
    const sql = sqlOf('group by s.line_cd');
    expect(sql).toContain('count(*) as ken');
    expect(sql).not.toContain('status');
    expect(sql).toContain('order by s.line_cd');
  });

  it('作業者別実績は良品数の降順、工程別は工程名の昇順', async () => {
    await service.dailyReport({});
    expect(sqlOf('group by j.sagyousha')).toContain('order by yoryo desc');
    expect(sqlOf('group by j.kotei_nm')).toContain('order by j.kotei_nm');
  });

  it('納期遅れは status <> 完了 かつ noki_ymd < curdate() を明示 join で判定する', async () => {
    await service.dailyReport({});
    const sql = sqlOf("s.status <> '完了'");
    expect(sql).toContain('join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd');
    expect(sql).toContain('s.noki_ymd < curdate()');
    expect(sql).toContain('order by s.noki_ymd');
    expect(sql).not.toContain('<=');
  });

  it('出力日はサーバ (DB) の curdate() から取得する', async () => {
    await service.dailyReport({});
    expect(sqlOf('output_ymd')).toContain('curdate()');
  });

  describe('対象日 (ymd) の扱い', () => {
    it('日付でない文字列でも集計 SQL は変わらず、DB 書き込みも起きない', async () => {
      const report = await service.dailyReport({ ymd: 'abc' });
      expect(report.ymd).toBe('abc');
      expect(report.ymd_filter_applied).toBe(false);
      for (const [sql, params] of db.query.mock.calls) {
        expect(sql).not.toContain('abc');
        expect(params).toBeUndefined();
      }
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('SQL に見える文字列を渡しても SQL は組み立てられない', async () => {
      await service.dailyReport({ ymd: "'or 1=1" });
      for (const [sql] of db.query.mock.calls) {
        expect(sql).not.toContain('1=1');
      }
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('10 文字ちょうどは受け付け、11 文字は 400 で DB へ問い合わせない', async () => {
      await expect(service.dailyReport({ ymd: '2026-08-19' })).resolves.toBeDefined();

      db.query.mockClear();
      await expect(service.dailyReport({ ymd: '2026-08-199' })).rejects.toThrow(
        BadRequestException,
      );
      expect(db.query).not.toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('文字列以外の型は 400 で DB へ問い合わせない', async () => {
      await expect(
        service.dailyReport({ ymd: { toString: () => '2026-08-19' } as unknown as string }),
      ).rejects.toThrow(BadRequestException);
      expect(db.query).not.toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });
  });
});
