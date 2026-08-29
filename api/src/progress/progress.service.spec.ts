import { BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { INT_MAX, ProgressQuantityService } from './progress-quantity.service';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  let db: { insert: jest.Mock; query: jest.Mock };
  let service: ProgressService;

  const dto = {
    shiji_no: 'SJ-2608-0002',
    kotei_no: '2',
    kotei_nm: '機械加工',
    setsubi_cd: 'LT-201',
    sagyousha: '田中 一郎',
    yoryo_suryo: '10',
    furyo_suryo: '0',
    kanryo: '0',
  };

  beforeEach(() => {
    db = {
      insert: jest.fn().mockResolvedValue({ insertId: 501, affectedRows: 1 }),
      query: jest.fn().mockResolvedValue([]),
    };
    service = new ProgressService(db as unknown as DatabaseService, new ProgressQuantityService());
  });

  describe('create', () => {
    it('正常時は t_kotei_jisseki へ INSERT し、t_seizou_shiji へ加算 UPDATE する', async () => {
      const result = await service.create(dto);

      expect(result).toMatchObject({
        jisseki_id: 501,
        yoryo_suryo: 10,
        furyo_suryo: 0,
        kanryo: false,
        message: '実績を登録しました。',
      });

      expect(db.insert).toHaveBeenCalledTimes(2);
      const [insertSql, insertParams] = db.insert.mock.calls[0];
      expect(insertSql).toContain('insert into t_kotei_jisseki');
      expect(insertSql).toContain('now()');
      expect(insertSql).toContain('null');
      expect(insertParams).toEqual(['SJ-2608-0002', 2, '機械加工', 'LT-201', '田中 一郎', 10, 0]);

      const [updateSql, updateParams] = db.insert.mock.calls[1];
      expect(updateSql).toContain('update t_seizou_shiji');
      expect(updateSql).toContain('kanryo_suryo = kanryo_suryo + ?');
      expect(updateSql).toContain('furyo_suryo  = furyo_suryo  + ?');
      expect(updateSql).toContain("status = '作業中'");
      expect(updateSql).toContain('where shiji_no = ?');
      expect(updateParams).toEqual([10, 0, 'SJ-2608-0002']);
    });

    it('工程完了=1 の場合は shuryo_dt に now() を入れる', async () => {
      const result = await service.create({ ...dto, kanryo: '1' });
      expect(result.kanryo).toBe(true);
      const [insertSql] = db.insert.mock.calls[0];
      expect(insertSql).toContain('now(), now()');
      expect(insertSql).not.toContain('null');
    });

    it.each(['あ', '', '1e3', '１０'])(
      '良品数が非数値 (%p) の場合は 400 で、DB 書き込みは発生しない',
      async (value) => {
        await expect(service.create({ ...dto, yoryo_suryo: value })).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.create({ ...dto, yoryo_suryo: value })).rejects.toThrow(
          '良品数と不良数は数値で入力してください。',
        );
        expect(db.insert).not.toHaveBeenCalled();
      },
    );

    it('不良数が非数値の場合も同じメッセージで 400、DB 書き込みなし', async () => {
      await expect(service.create({ ...dto, furyo_suryo: 'x' })).rejects.toThrow(
        '良品数と不良数は数値で入力してください。',
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('小数の良品数は 400 で、DB 書き込みなし', async () => {
      await expect(service.create({ ...dto, yoryo_suryo: '10.5' })).rejects.toThrow(
        '良品数と不良数は整数で入力してください。',
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('INT 上限ちょうどは登録でき、+1 は 400 で DB 書き込みなし', async () => {
      await service.create({ ...dto, yoryo_suryo: String(INT_MAX) });
      expect(db.insert.mock.calls[0][1][5]).toBe(INT_MAX);

      db.insert.mockClear();
      await expect(service.create({ ...dto, yoryo_suryo: String(INT_MAX + 1) })).rejects.toThrow(
        BadRequestException,
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('0 件の登録も CFML と同じく受け付ける', async () => {
      const result = await service.create({ ...dto, yoryo_suryo: '0', furyo_suryo: '0' });
      expect(result.yoryo_suryo).toBe(0);
      expect(db.insert.mock.calls[1][1]).toEqual([0, 0, 'SJ-2608-0002']);
    });

    it('工程順が非数値の場合は 400 で、DB 書き込みなし', async () => {
      await expect(service.create({ ...dto, kotei_no: 'あ' })).rejects.toThrow(
        '工程順は数値で入力してください。',
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('設備なし (空文字) はそのままバインドする', async () => {
      await service.create({ ...dto, setsubi_cd: '' });
      expect(db.insert.mock.calls[0][1][3]).toBe('');
    });

    it('列長を超える文字列は 400 で、DB 書き込みなし', async () => {
      await expect(service.create({ ...dto, sagyousha: 'あ'.repeat(61) })).rejects.toThrow(
        BadRequestException,
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('文字列以外の型が来た場合は 400 で、DB 書き込みなし', async () => {
      await expect(
        service.create({ ...dto, kotei_nm: { toString: () => 'x' } as unknown as string }),
      ).rejects.toThrow(BadRequestException);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('SQL は動的値を全てプレースホルダにバインドする', async () => {
      await service.create({ ...dto, shiji_no: "SJ' or 1=1 --" });
      const [insertSql, insertParams] = db.insert.mock.calls[0];
      expect(insertSql).not.toContain('1=1');
      expect(insertParams[0]).toBe("SJ' or 1=1 --");
    });
  });

  describe('参照系', () => {
    it('直近の実績は jisseki_id 降順 15 件で m_setsubi を left join する', async () => {
      await service.findRecentRecords();
      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toContain('from t_kotei_jisseki j');
      expect(sql).toContain('left join m_setsubi m on j.setsubi_cd = m.setsubi_cd');
      expect(sql).toContain('order by j.jisseki_id desc');
      expect(sql).toContain('limit 15');
      expect(params).toBeUndefined();
    });

    it('製造指示一覧は完了以外を納期昇順で返す', async () => {
      await service.findShijiOrders();
      const [sql] = db.query.mock.calls[0];
      expect(sql).toContain('join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd');
      expect(sql).toContain("where s.status <> '完了'");
      expect(sql).toContain('order by s.noki_ymd');
    });

    it('設備一覧は setsubi_cd 昇順', async () => {
      await service.findSetsubi();
      const [sql] = db.query.mock.calls[0];
      expect(sql).toContain('from m_setsubi');
      expect(sql).toContain('order by setsubi_cd');
    });

    it('工程名は CFML の固定リストと同じ', () => {
      expect(service.findKoteiNames()).toEqual(['鋳造', '機械加工', '組立', '塗装', '検査']);
    });
  });
});
