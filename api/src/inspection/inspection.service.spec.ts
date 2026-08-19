import { BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { InspectionJudgmentService } from './inspection-judgment.service';
import { InspectionService } from './inspection.service';

describe('InspectionService', () => {
  let db: { insert: jest.Mock; query: jest.Mock };
  let service: InspectionService;

  const dto = {
    shiji_no: 'SJ-2608-0002',
    lot_no: 'LOT-0819-01',
    kensa_sha: '高橋 花子',
    sunpou: '220.000',
    kijun_min: '219.900',
    kijun_max: '220.100',
    furyo_naiyo: '',
  };

  beforeEach(() => {
    db = {
      insert: jest.fn().mockResolvedValue({ insertId: 101, affectedRows: 1 }),
      query: jest.fn().mockResolvedValue([
        {
          kensa_id: 101,
          kensa_ymd: '2026-08-19',
          sunpou: '220.000',
          kijun_min: '219.900',
          kijun_max: '220.100',
        },
      ]),
    };
    service = new InspectionService(
      db as unknown as DatabaseService,
      new InspectionJudgmentService(),
    );
  });

  describe('create', () => {
    it('非数値の測定値は 400 で、INSERT されない', async () => {
      await expect(service.create({ ...dto, sunpou: 'あ' })).rejects.toThrow(BadRequestException);
      await expect(service.create({ ...dto, sunpou: 'あ' })).rejects.toThrow(
        '測定値は数値で入力してください。',
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('正常時は判定結果付きで t_kensa へ INSERT する', async () => {
      const result = await service.create(dto);

      expect(result.hantei).toBe('OK');
      expect(result.kensa_id).toBe(101);
      expect(result.message).toBe('検査結果を登録しました。判定は OK です。');

      expect(db.insert).toHaveBeenCalledTimes(1);
      const [sql, params] = db.insert.mock.calls[0];
      expect(sql).toContain('insert into t_kensa');
      expect(sql).toContain('curdate()');
      expect(params).toEqual([
        'SJ-2608-0002',
        'LOT-0819-01',
        '高橋 花子',
        '220.000',
        '219.900',
        '220.100',
        'OK',
        '',
      ]);
    });

    it.each([
      ['219.899', 'NG'],
      ['220.090', 'OK'],
      ['220.091', '再検査'],
      ['220.100', '再検査'],
      ['220.101', 'NG'],
    ])('測定値 %s は hantei=%s で登録される', async (sunpou, expected) => {
      const result = await service.create({ ...dto, sunpou });
      expect(result.hantei).toBe(expected);
      expect(db.insert.mock.calls[0][1][6]).toBe(expected);
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      db.query.mockResolvedValue([]);
    });

    it('絞込なしでは where 句を付けない', async () => {
      await service.findAll({});
      const [sql, params] = db.query.mock.calls[0];
      expect(sql).not.toContain('where');
      expect(sql).toContain('order by k.kensa_ymd desc, k.kensa_id desc');
      expect(params).toEqual([]);
    });

    it('shiji_no と hantei をパラメータバインドで絞込する', async () => {
      await service.findAll({ shiji_no: "SJ' or 1=1 --", hantei: '再検査' });
      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toContain('where k.shiji_no = ? and k.hantei = ?');
      expect(sql).not.toContain('1=1');
      expect(params).toEqual(["SJ' or 1=1 --", '再検査']);
    });
  });

  it('defectSummary は OK 以外かつ不良内容ありを件数降順で集計する', async () => {
    db.query.mockResolvedValue([]);
    await service.defectSummary();
    const [sql] = db.query.mock.calls[0];
    expect(sql).toContain("hantei <> 'OK' and furyo_naiyo <> ''");
    expect(sql).toContain('group by furyo_naiyo');
    expect(sql).toContain('order by ken desc');
  });

  it('findShijiOrders は t_seizou_shiji と m_hinmoku を結合する', async () => {
    db.query.mockResolvedValue([]);
    await service.findShijiOrders();
    const [sql] = db.query.mock.calls[0];
    expect(sql).toContain('from t_seizou_shiji s');
    expect(sql).toContain('join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd');
    expect(sql).toContain('order by s.shiji_no desc');
  });
});
