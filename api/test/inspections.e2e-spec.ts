import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { InspectionsModule } from '../src/inspections/inspections.module.js';
import { InspectionsRepository } from '../src/inspections/inspections.repository.js';
import { InMemoryInspectionsRepository } from './in-memory-inspections.repository.js';

// API 層の統合テスト。DB はインメモリ実装に差し替える (MySQL 版と同じ抽出条件を再現)。
describe('Inspections API (integration)', () => {
  let app: INestApplication<App>;
  const repo = new InMemoryInspectionsRepository();

  const base = {
    shiji_no: 'S-TEST-001',
    lot_no: 'LOT-TEST-01',
    kensa_sha: '高橋 花子',
    kijun_min: '219.900',
    kijun_max: '220.100',
    furyo_naiyo: '',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [InspectionsModule],
    })
      .overrideProvider(InspectionsRepository)
      .useValue(repo)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST で登録した結果が GET で取得でき、絞り込みが機能する', async () => {
    const http = request(app.getHttpServer());

    const ok = await http
      .post('/api/inspections')
      .send({ ...base, sunpou: '220.000' })
      .expect(201);
    expect(ok.body.hantei).toBe('OK');
    expect(ok.body.message).toBe('検査結果を登録しました。判定は OK です。');

    const ng = await http
      .post('/api/inspections')
      .send({ ...base, sunpou: '220.101', furyo_naiyo: '寸法不良' })
      .expect(201);
    expect(ng.body.hantei).toBe('NG');

    const sai = await http
      .post('/api/inspections')
      .send({ ...base, sunpou: '220.095', furyo_naiyo: '寸法不良' })
      .expect(201);
    expect(sai.body.hantei).toBe('再検査');

    await http
      .post('/api/inspections')
      .send({ ...base, shiji_no: 'S-TEST-002', sunpou: '219.899' })
      .expect(201);

    const all = await http.get('/api/inspections').expect(200);
    expect(all.body).toHaveLength(4);
    expect(all.body[0].kensa_id).toBeGreaterThan(all.body[1].kensa_id);
    expect(
      all.body.find(
        (r: { kensa_id: number }) => r.kensa_id === ok.body.kensa_id,
      ),
    ).toMatchObject({
      shiji_no: 'S-TEST-001',
      sunpou: '220.000',
      kijun_min: '219.900',
      kijun_max: '220.100',
      hantei: 'OK',
    });

    const ngOnly = await http.get('/api/inspections?hantei=NG').expect(200);
    expect(ngOnly.body.map((r: { hantei: string }) => r.hantei)).toEqual([
      'NG',
      'NG',
    ]);

    const saiOnly = await http
      .get('/api/inspections')
      .query({ hantei: '再検査' })
      .expect(200);
    expect(saiOnly.body).toHaveLength(1);
    expect(saiOnly.body[0].kensa_id).toBe(sai.body.kensa_id);

    const byShiji = await http
      .get('/api/inspections')
      .query({ shiji_no: 'S-TEST-002', hantei: 'NG' })
      .expect(200);
    expect(byShiji.body).toHaveLength(1);
    expect(byShiji.body[0].shiji_no).toBe('S-TEST-002');

    const summary = await http
      .get('/api/inspections/defect-summary')
      .expect(200);
    expect(summary.body).toEqual([{ furyo_naiyo: '寸法不良', ken: 2 }]);
  });

  it('SQL インジェクション文字列は値として扱われ、絞り込み結果が 0 件になる', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/inspections')
      .query({ shiji_no: "' or '1'='1" })
      .expect(200);
    expect(res.body).toEqual([]);
  });

  it('測定値が非数値なら 400 を返し登録されない', async () => {
    const before = repo.rows.length;
    const res = await request(app.getHttpServer())
      .post('/api/inspections')
      .send({ ...base, sunpou: 'abc' })
      .expect(400);
    expect(res.body.message).toBe('測定値は数値で入力してください。');
    expect(repo.rows).toHaveLength(before);
  });
});
