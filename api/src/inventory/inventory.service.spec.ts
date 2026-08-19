import { BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { InventoryJudgmentService } from './inventory-judgment.service';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let db: { insert: jest.Mock; query: jest.Mock };
  let service: InventoryService;

  const itemRows = [
    {
      buhin_cd: 'BLT-M12',
      buhin_nm: '六角ボルト M12x40',
      souko_cd: 'W-01',
      zaiko_su: 1240,
      anzen_zaiko: 400,
      hacchu_ten: 600,
      shiire_nm: '名古屋鋼機商事',
      tanka: '38.00',
      kingaku: '47120.00',
    },
    {
      buhin_cd: 'BLT-M16',
      buhin_nm: '六角ボルト M16x60',
      souko_cd: 'W-01',
      zaiko_su: 180,
      anzen_zaiko: 300,
      hacchu_ten: 450,
      shiire_nm: '名古屋鋼機商事',
      tanka: '72.00',
      kingaku: '12960.00',
    },
    {
      buhin_cd: 'GSK-100',
      buhin_nm: 'ガスケット 100A',
      souko_cd: 'W-01',
      zaiko_su: 120,
      anzen_zaiko: 120,
      hacchu_ten: 180,
      shiire_nm: '東海シール工業',
      tanka: '540.00',
      kingaku: '64800.00',
    },
  ];

  const movement = { mode: 'nyuko', buhin_cd: 'BLT-M12', souko_cd: 'W-01', su: '10' };

  beforeEach(() => {
    db = {
      insert: jest.fn().mockResolvedValue({ insertId: 0, affectedRows: 1 }),
      query: jest.fn().mockResolvedValue(itemRows),
    };
    service = new InventoryService(
      db as unknown as DatabaseService,
      new InventoryJudgmentService(),
    );
  });

  describe('findAll', () => {
    it('絞込なしは全件を souko_cd, buhin_cd 順で取得し、判定を付与する', async () => {
      const result = await service.findAll({});

      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toContain('from t_zaiko');
      expect(sql).not.toContain('where');
      expect(sql.trimEnd().endsWith('order by souko_cd, buhin_cd')).toBe(true);
      expect(params).toEqual([]);

      expect(result.buhin_ken).toBe(3);
      expect(result.rows.map((row) => row.hantei)).toEqual([
        '適正',
        '欠品リスク',
        '発注点割れ',
      ]);
      expect(result.rows[0].kingaku).toBe('47120.00');
    });

    it('倉庫絞込はプレースホルダにバインドする', async () => {
      await service.findAll({ souko: "W-01' or '1'='1" });

      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toContain('where souko_cd = ?');
      expect(params).toEqual(["W-01' or '1'='1"]);
    });
  });

  describe('warehouseSummary', () => {
    it('全倉庫を集計し、合計は小計の十進加算で求める', async () => {
      db.query.mockResolvedValue([
        { souko_cd: 'W-01', ken: 4, kingaku: '380130.05' },
        { souko_cd: 'W-02', ken: 3, kingaku: '120000.10' },
      ]);

      const result = await service.warehouseSummary();

      const [sql] = db.query.mock.calls[0];
      expect(sql).toContain('count(*) as ken');
      expect(sql).toContain('sum(zaiko_su * tanka) as kingaku');
      expect(sql).toContain('group by souko_cd');
      expect(sql).toContain('order by souko_cd');
      expect(result.total_kingaku).toBe('500130.15');
      expect(result.rows).toHaveLength(2);
    });
  });

  describe('createMovement', () => {
    it('非数値の数量は 400 で、UPDATE されない', async () => {
      await expect(service.createMovement({ ...movement, su: 'あ' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createMovement({ ...movement, su: 'あ' })).rejects.toThrow(
        '数量は1以上の数値で入力してください。',
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('数量 0 は 400 で、UPDATE されない', async () => {
      await expect(service.createMovement({ ...movement, su: '0' })).rejects.toThrow(
        '数量は1以上の数値で入力してください。',
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('不正な入出庫区分は 400 で、UPDATE されない', async () => {
      await expect(service.createMovement({ ...movement, mode: 'delete' })).rejects.toThrow(
        '入出庫区分は nyuko または shukko で指定してください。',
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('列長を超える部品コードは 400 で、UPDATE されない', async () => {
      await expect(
        service.createMovement({ ...movement, buhin_cd: 'X'.repeat(21) }),
      ).rejects.toThrow('buhin_cd は 20 文字以内で入力してください。');
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('入庫は在庫数を加算する UPDATE を発行する', async () => {
      const result = await service.createMovement(movement);

      expect(db.insert).toHaveBeenCalledTimes(1);
      const [sql, params] = db.insert.mock.calls[0];
      expect(sql).toContain('update t_zaiko set zaiko_su = zaiko_su + ?');
      expect(sql).toContain('where buhin_cd = ? and souko_cd = ?');
      expect(params).toEqual([10, 'BLT-M12', 'W-01']);
      expect(result.message).toBe('入庫を登録しました。');
      expect(result.affected_rows).toBe(1);
    });

    it('出庫は在庫数を減算する UPDATE を発行する', async () => {
      const result = await service.createMovement({ ...movement, mode: 'shukko', su: '1' });

      const [sql, params] = db.insert.mock.calls[0];
      expect(sql).toContain('update t_zaiko set zaiko_su = zaiko_su - ?');
      expect(params).toEqual([1, 'BLT-M12', 'W-01']);
      expect(result.message).toBe('出庫を登録しました。');
    });

    it('対象が存在しない場合も CFML と同じく成功メッセージだが affected_rows は 0', async () => {
      db.insert.mockResolvedValue({ insertId: 0, affectedRows: 0 });

      const result = await service.createMovement(movement);

      expect(result.affected_rows).toBe(0);
      expect(result.message).toBe('入庫を登録しました。');
    });
  });
});
