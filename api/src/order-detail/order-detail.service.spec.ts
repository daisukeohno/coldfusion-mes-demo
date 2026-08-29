import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OrderDetailService } from './order-detail.service';
import { OrderDetailSummaryService } from './order-detail-summary.service';

describe('OrderDetailService', () => {
  let db: { query: jest.Mock };
  let service: OrderDetailService;

  const header = {
    shiji_no: 'SJ-2608-0002',
    hinmoku_cd: 'IMP-2200',
    line_cd: 'L-02',
    suryo: 200,
    kanryo_suryo: 168,
    furyo_suryo: 6,
    noki_ymd: '2026-08-21',
    status: '作業中',
    tokui_nm: '中部プラント工業',
    bikou: '材質ロット変更あり',
    toroku_ymd: '2026-08-01 10:00:00',
    hinmoku_nm: 'インペラ 220mm',
    kikaku: 'SCS13 / ステンレス',
    tani: '個',
    hyojun_jikan: '35.25',
  };

  beforeEach(() => {
    db = { query: jest.fn() };
    service = new OrderDetailService(
      db as unknown as DatabaseService,
      new OrderDetailSummaryService(),
    );
  });

  it.each([undefined, ''])('shiji_no=%p は 400 で DB を呼ばない', async (shijiNo) => {
    await expect(service.findOne(shijiNo)).rejects.toThrow(BadRequestException);
    await expect(service.findOne(shijiNo)).rejects.toThrow('shiji_no は必須です。');
    expect(db.query).not.toHaveBeenCalled();
  });

  it('21文字以上の shiji_no は 400 で DB を呼ばない', async () => {
    await expect(service.findOne('S'.repeat(21))).rejects.toThrow(
      'shiji_no は 20 文字以内で入力してください。',
    );
    expect(db.query).not.toHaveBeenCalled();
  });

  it('存在しない指示番号は指定文言の 404 で、明細 SQL を呼ばない', async () => {
    db.query.mockResolvedValueOnce([]);

    const request = service.findOne('SJ-NOT-FOUND');
    await expect(request).rejects.toThrow(NotFoundException);
    await expect(request).rejects.toThrow('指示番号 SJ-NOT-FOUND は登録されていません。');
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1]).toEqual(['SJ-NOT-FOUND']);
  });

  it('正常時は3本のSQLを同じ指示番号へバインドし、集計値を返す', async () => {
    db.query
      .mockResolvedValueOnce([header])
      .mockResolvedValueOnce([
        {
          jisseki_id: 1,
          shiji_no: header.shiji_no,
          kotei_no: 1,
          kotei_nm: '機械加工',
          setsubi_cd: 'LT-201',
          sagyousha: '鈴木 次郎',
          kaishi_dt: '2026-08-14 10:00:00',
          shuryo_dt: null,
          yoryo_suryo: 168,
          furyo_suryo: 6,
          setsubi_nm: 'NC旋盤 φ500',
        },
      ])
      .mockResolvedValueOnce([
        {
          kensa_id: 1,
          shiji_no: header.shiji_no,
          lot_no: 'LOT-A101',
          kensa_ymd: '2026-08-17',
          kensa_sha: '高橋 花子',
          sunpou: '220.010',
          kijun_min: '219.900',
          kijun_max: '220.100',
          hantei: 'OK',
          furyo_naiyo: '',
        },
      ]);

    const result = await service.findOne(header.shiji_no);

    expect(db.query).toHaveBeenCalledTimes(3);
    expect(db.query.mock.calls[0][1]).toEqual([header.shiji_no]);
    expect(db.query.mock.calls[1][1]).toEqual([header.shiji_no]);
    expect(db.query.mock.calls[2][1]).toEqual([header.shiji_no]);
    expect(db.query.mock.calls[0][0]).toContain(
      'join m_hinmoku h on s.hinmoku_cd = h.hinmoku_cd',
    );
    expect(db.query.mock.calls[1][0]).toContain('order by j.kotei_no');
    expect(db.query.mock.calls[2][0]).toContain(
      'order by kensa_ymd desc, kensa_id desc',
    );
    expect(result.shiji).toEqual(header);
    expect(result.summary).toEqual({ zan: 32, rate: 84, yotei_kosu: 7050 });
    expect(result.kotei).toHaveLength(1);
    expect(result.kensa).toHaveLength(1);
  });
});
