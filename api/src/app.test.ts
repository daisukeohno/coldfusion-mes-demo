import request from 'supertest';
import { createApp } from './app';
import type {
  InspectionFilters,
  InspectionRepository,
} from './repositories/inspectionRepository';
import type {
  DefectSummary,
  InspectionInsert,
  InspectionRecord,
  OrderOption,
} from './types/inspection';

class FakeInspectionRepository implements InspectionRepository {
  created: InspectionInsert[] = [];
  lastFilters: InspectionFilters = {};
  inspections: InspectionRecord[] = [];

  async create(input: InspectionInsert): Promise<number> {
    this.created.push(input);
    return 101;
  }

  async findAll(filters: InspectionFilters): Promise<InspectionRecord[]> {
    this.lastFilters = filters;
    return this.inspections.filter(
      (inspection) =>
        (!filters.shiji_no || inspection.shiji_no === filters.shiji_no) &&
        (!filters.hantei || inspection.hantei === filters.hantei),
    );
  }

  async getDefectSummary(): Promise<DefectSummary[]> {
    return [];
  }

  async getOrders(): Promise<OrderOption[]> {
    return [];
  }
}

describe('inspection API', () => {
  let repository: FakeInspectionRepository;

  beforeEach(() => {
    repository = new FakeInspectionRepository();
  });

  it('判定結果を保存して登録結果を返す', async () => {
    const response = await request(createApp(repository))
      .post('/api/inspections')
      .send({
        shiji_no: 'SJ-2026-001',
        lot_no: 'LOT-0828-01',
        kensa_sha: '高橋 花子',
        sunpou: '220.100',
        kijun_min: '219.900',
        kijun_max: '220.100',
        furyo_naiyo: '',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      kensa_id: 101,
      hantei: '再検査',
      message: '検査結果を登録しました。判定は 再検査 です。',
    });
    expect(repository.created).toEqual([
      expect.objectContaining({
        shiji_no: 'SJ-2026-001',
        sunpou: '220.100',
        hantei: '再検査',
      }),
    ]);
  });

  it('測定値が非数値なら保存せず400を返す', async () => {
    const response = await request(createApp(repository))
      .post('/api/inspections')
      .send({
        shiji_no: 'SJ-2026-001',
        lot_no: 'LOT-0828-01',
        kensa_sha: '高橋 花子',
        sunpou: '測定不能',
        kijun_min: '219.900',
        kijun_max: '220.100',
        furyo_naiyo: '',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: '測定値は数値で入力してください。',
    });
    expect(repository.created).toHaveLength(0);
  });

  it('指示番号と判定で一覧を絞り込む', async () => {
    repository.inspections = [
      {
        kensa_id: 1,
        shiji_no: 'SJ-2026-001',
        hinmoku_nm: 'インペラ',
        line_cd: 'L1',
        lot_no: 'LOT-01',
        kensa_ymd: '2026-08-28',
        kensa_sha: '高橋 花子',
        sunpou: '220.101',
        kijun_min: '219.900',
        kijun_max: '220.100',
        hantei: 'NG',
        furyo_naiyo: '寸法超過',
      },
      {
        kensa_id: 2,
        shiji_no: 'SJ-2026-002',
        hinmoku_nm: 'シャフト',
        line_cd: 'L2',
        lot_no: 'LOT-02',
        kensa_ymd: '2026-08-28',
        kensa_sha: '佐藤 太郎',
        sunpou: '220.000',
        kijun_min: '219.900',
        kijun_max: '220.100',
        hantei: 'OK',
        furyo_naiyo: '',
      },
    ];

    const response = await request(createApp(repository)).get(
      '/api/inspections?shiji_no=SJ-2026-001&hantei=NG',
    );

    expect(response.status).toBe(200);
    expect(repository.lastFilters).toEqual({
      shiji_no: 'SJ-2026-001',
      hantei: 'NG',
    });
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      shiji_no: 'SJ-2026-001',
      hantei: 'NG',
    });
  });
});
