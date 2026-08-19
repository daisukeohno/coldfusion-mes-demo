import { BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MaintenanceJudgmentService } from './maintenance-judgment.service';
import { MaintenanceService } from './maintenance.service';

describe('MaintenanceService', () => {
  let db: { insert: jest.Mock; query: jest.Mock };
  let service: MaintenanceService;

  const dto = {
    setsubi_cd: 'EQ-101',
    shubetsu: '定期点検',
    teishi_jikan: '2.5',
    fukyu: '0',
    naiyo: 'ベルト点検',
    tantou: '保全 大野',
  };

  /** m_setsubi の存在確認 → curdate() の順にクエリが飛ぶ */
  const mockQueries = (): void => {
    db.query.mockImplementation((sql: string) => {
      if (sql.includes('from m_setsubi where setsubi_cd')) {
        return Promise.resolve([{ setsubi_cd: 'EQ-101' }]);
      }
      if (sql.includes('curdate() as today')) {
        return Promise.resolve([{ today: '2026-08-19' }]);
      }
      return Promise.resolve([]);
    });
  };

  beforeEach(() => {
    db = {
      insert: jest.fn().mockResolvedValue({ insertId: 501, affectedRows: 1 }),
      query: jest.fn(),
    };
    mockQueries();
    service = new MaintenanceService(
      db as unknown as DatabaseService,
      new MaintenanceJudgmentService(),
    );
  });

  describe('create', () => {
    it('正常時は curdate() の発生日と正規化した停止時間で INSERT する', async () => {
      const result = await service.create(dto);

      expect(result.hozen_id).toBe(501);
      expect(result.message).toBe('保全記録を登録しました。');
      expect(result.hassei_ymd).toBe('2026-08-19');
      expect(result.fukyu_ymd).toBeNull();

      expect(db.insert).toHaveBeenCalledTimes(1);
      const [sql, params] = db.insert.mock.calls[0];
      expect(sql).toContain('insert into t_hozen');
      expect(sql).toContain('values (?, ?, curdate(), null, ?, ?, ?)');
      expect(params).toEqual(['EQ-101', '定期点検', '2.50', 'ベルト点検', '保全 大野']);
    });

    it('復旧=1 のときだけ復旧日に curdate() を入れる', async () => {
      const result = await service.create({ ...dto, fukyu: '1' });
      expect(db.insert.mock.calls[0][0]).toContain('values (?, ?, curdate(), curdate(), ?, ?, ?)');
      expect(result.fukyu_ymd).toBe('2026-08-19');
    });

    it.each(['0', '', undefined, 'true', '01'])('復旧=%p は未復旧 (null) で INSERT する', async (fukyu) => {
      await service.create({ ...dto, fukyu });
      expect(db.insert.mock.calls[0][0]).toContain('curdate(), null,');
    });

    it('停止時間が非数値の場合は CFML と同じく 0 で登録する', async () => {
      const result = await service.create({ ...dto, teishi_jikan: 'あ' });
      expect(result.teishi_jikan).toBe('0.00');
      expect(db.insert.mock.calls[0][1][2]).toBe('0.00');
    });

    it.each<[unknown, string]>([
      ['0.004', '0.00'],
      ['0.005', '0.01'],
      ['999999.99', '999999.99'],
      [' +2.5 ', '2.50'],
    ])('停止時間 %p は %s にして DECIMAL(8,2) 列へバインドする', async (input, expected) => {
      await service.create({ ...dto, teishi_jikan: input });
      expect(db.insert.mock.calls[0][1][2]).toBe(expected);
    });

    it('DECIMAL(8,2) の上限を 0.01 超える停止時間は 400 で、INSERT されない', async () => {
      await expect(service.create({ ...dto, teishi_jikan: '1000000.00' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create({ ...dto, teishi_jikan: '1000000.00' })).rejects.toThrow(
        '停止時間(h) は 999999.99 以内で入力してください。',
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('設備未選択・種別不正・存在しない設備コードは 400 で、INSERT されない', async () => {
      await expect(service.create({ ...dto, setsubi_cd: '' })).rejects.toThrow(
        '設備を選択してください。',
      );
      await expect(service.create({ ...dto, shubetsu: '清掃' })).rejects.toThrow(
        '種別は定期点検・故障修理・部品交換から選択してください。',
      );
      db.query.mockResolvedValue([]);
      await expect(service.create({ ...dto, setsubi_cd: 'EQ-999' })).rejects.toThrow(
        '設備マスタに存在しない設備コードです。',
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('列長を超える文字列・文字列以外の型は 400 で、INSERT されない', async () => {
      await expect(service.create({ ...dto, naiyo: 'あ'.repeat(256) })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create({ ...dto, tantou: 'x'.repeat(61) })).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        service.create({ ...dto, tantou: { toString: () => 'x' } as unknown as string }),
      ).rejects.toThrow(BadRequestException);
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('findEquipmentPlans', () => {
    it('最終点検日と未復旧件数を 1 本の SQL で取り、判定を付けて返す', async () => {
      db.query.mockImplementation((sql: string) => {
        if (sql.includes('curdate() as today')) {
          return Promise.resolve([{ today: '2026-08-19' }]);
        }
        return Promise.resolve([
          {
            setsubi_cd: 'EQ-101',
            setsubi_nm: 'NC旋盤 1号機',
            line_cd: 'L1',
            maker: 'ヤマザキ',
            dounyu_ymd: '2018-04-01',
            tenken_cycle: 30,
            last_ymd: '2026-07-19',
            open_ken: 2,
          },
          {
            setsubi_cd: 'EQ-102',
            setsubi_nm: 'マシニングセンタ',
            line_cd: 'L1',
            maker: 'オークマ',
            dounyu_ymd: '2020-04-01',
            tenken_cycle: 60,
            last_ymd: null,
            open_ken: 0,
          },
        ]);
      });

      const rows = await service.findEquipmentPlans();

      expect(rows[0]).toMatchObject({
        setsubi_cd: 'EQ-101',
        last_ymd: '2026-07-19',
        next_ymd: '2026-08-18',
        okure: true,
        open_ken: 2,
        kadou: false,
        keika: 8,
      });
      expect(rows[1]).toMatchObject({
        setsubi_cd: 'EQ-102',
        last_ymd: null,
        next_ymd: null,
        okure: true,
        open_ken: 0,
        kadou: true,
      });

      const equipmentCall = db.query.mock.calls.find(([sql]: [string]) =>
        sql.includes('from m_setsubi m'),
      );
      expect(equipmentCall[0]).toContain("z.fukyu_ymd is null");
      expect(equipmentCall[0]).toContain('order by m.line_cd, m.setsubi_cd');
      // 最終点検日の対象種別もパラメータバインドする
      expect(equipmentCall[1]).toEqual(['定期点検']);
    });
  });

  it('findAll は m_setsubi と内部結合し発生日の降順で取得する', async () => {
    db.query.mockResolvedValue([]);
    await service.findAll();
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toContain('from t_hozen z');
    expect(sql).toContain('join m_setsubi m on z.setsubi_cd = m.setsubi_cd');
    expect(sql).toContain('order by z.hassei_ymd desc');
    expect(params).toBeUndefined();
  });

  it('downtimeSummary は設備別に件数と停止時間を集計し停止時間の降順で返す', async () => {
    db.query.mockResolvedValue([
      { setsubi_cd: 'EQ-101', setsubi_nm: 'NC旋盤 1号機', ken: 3, jikan: '12.50' },
      { setsubi_cd: 'EQ-102', setsubi_nm: 'マシニングセンタ', ken: 1, jikan: null },
    ]);
    const rows = await service.downtimeSummary();
    const [sql] = db.query.mock.calls[0];
    expect(sql).toContain('group by z.setsubi_cd, m.setsubi_nm');
    expect(sql).toContain('order by jikan desc');
    expect(rows[0].jikan).toBe('12.50');
    expect(rows[1].jikan).toBe('0.00');
  });
});
