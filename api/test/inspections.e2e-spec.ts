import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import request from 'supertest';
import { InspectionJudgmentService } from '../src/inspections/inspection-judgment.service';
import { CreateInspectionResponse } from '../src/inspections/inspection.dto';
import { InspectionsController } from '../src/inspections/inspections.controller';
import { InspectionsRepository } from '../src/inspections/inspections.repository';
import { InspectionsService } from '../src/inspections/inspections.service';
import { InMemoryInspectionsRepository } from './in-memory-inspections.repository';

describe('/api/inspections (e2e, in-memory repository)', () => {
  let app: INestApplication<App>;
  let repo: InMemoryInspectionsRepository;

  const base = {
    shiji_no: 'SJ-2608-0002',
    lot_no: 'LOT-T001',
    kensa_sha: 'テスト 太郎',
    kijun_min: '219.900',
    kijun_max: '220.100',
    furyo_naiyo: '',
  };

  beforeEach(async () => {
    repo = new InMemoryInspectionsRepository();
    const moduleRef = await Test.createTestingModule({
      controllers: [InspectionsController],
      providers: [
        InspectionJudgmentService,
        InspectionsService,
        { provide: InspectionsRepository, useValue: repo },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST 中央値 → 201 OK で登録される', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/inspections')
      .send({ ...base, sunpou: '220.000' })
      .expect(201);
    expect(res.body).toMatchObject({
      kensa_id: 1,
      hantei: 'OK',
      message: '検査結果を登録しました。判定は OK です。',
    });
    expect(repo.rows[0]).toMatchObject({ sunpou: '220.000', hantei: 'OK' });
  });

  it('POST 上限ぎりぎり → 再検査 / 範囲外 → NG', async () => {
    const r1 = await request(app.getHttpServer())
      .post('/api/inspections')
      .send({ ...base, sunpou: '220.095' })
      .expect(201);
    expect((r1.body as CreateInspectionResponse).hantei).toBe('再検査');
    const r2 = await request(app.getHttpServer())
      .post('/api/inspections')
      .send({ ...base, sunpou: '220.140', furyo_naiyo: '外径寸法超過' })
      .expect(201);
    expect((r2.body as CreateInspectionResponse).hantei).toBe('NG');
  });

  it('POST 非数値 → 400 で登録されない', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/inspections')
      .send({ ...base, sunpou: 'abc' })
      .expect(400);
    expect((res.body as { message: string }).message).toBe(
      '測定値は数値で入力してください。',
    );
    await request(app.getHttpServer())
      .post('/api/inspections')
      .send({ ...base, sunpou: '' })
      .expect(400);
    expect(repo.rows).toHaveLength(0);
  });

  it('GET 絞込 (shiji_no / hantei) と defect-summary', async () => {
    repo.seed([
      row('SJ-A', '220.000', 'OK', ''),
      row('SJ-A', '220.140', 'NG', '外径寸法超過'),
      row('SJ-B', '220.150', 'NG', '外径寸法超過'),
      row('SJ-B', '220.095', '再検査', '要 三次元測定'),
      row('SJ-B', '220.200', 'NG', ''),
    ]);
    const all = await request(app.getHttpServer())
      .get('/api/inspections')
      .expect(200);
    expect(all.body).toHaveLength(5);

    const ng = await request(app.getHttpServer())
      .get('/api/inspections')
      .query({ hantei: 'NG' })
      .expect(200);
    expect(ng.body).toHaveLength(3);

    const re = await request(app.getHttpServer())
      .get('/api/inspections')
      .query({ hantei: '再検査' })
      .expect(200);
    expect(re.body).toHaveLength(1);

    const byShiji = await request(app.getHttpServer())
      .get('/api/inspections')
      .query({ shiji_no: 'SJ-B', hantei: 'NG' })
      .expect(200);
    expect(byShiji.body).toHaveLength(2);

    const summary = await request(app.getHttpServer())
      .get('/api/inspections/defect-summary')
      .expect(200);
    expect(summary.body).toEqual([
      { furyo_naiyo: '外径寸法超過', ken: 2 },
      { furyo_naiyo: '要 三次元測定', ken: 1 },
    ]);
  });
});

function row(shiji_no: string, sunpou: string, hantei: string, furyo: string) {
  return {
    shiji_no,
    hinmoku_nm: '品目',
    line_cd: 'L1',
    lot_no: 'LOT',
    kensa_ymd: '2026-01-01',
    kensa_sha: '検査者',
    sunpou,
    kijun_min: '219.900',
    kijun_max: '220.100',
    hantei,
    furyo_naiyo: furyo,
  };
}
