import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DefectSummary, InspectionRequest, OrderForInspection } from './inspection.model';
import { InspectionService } from './inspection.service';

describe('InspectionService', () => {
  let service: InspectionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InspectionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('POST /api/inspections で登録し判定を受け取る', () => {
    const request: InspectionRequest = {
      shiji_no: 'SJ-0001',
      lot_no: 'LOT-0101-01',
      kensa_sha: '高橋 花子',
      sunpou: '220.091',
      kijun_min: '219.900',
      kijun_max: '220.100',
      furyo_naiyo: '',
    };

    service.register(request).subscribe((response) => expect(response.hantei).toBe('再検査'));

    const req = httpMock.expectOne('/api/inspections');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ hantei: '再検査', message: '検査結果を登録しました。判定は 再検査 です。', kensa: null });
  });

  it('絞込なしのときクエリパラメータを付けない', () => {
    service.list().subscribe();

    const req = httpMock.expectOne('/api/inspections');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('絞込条件を shiji_no / hantei で送る', () => {
    service.list({ shijiNo: 'SJ-0001', hantei: '再検査' }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/inspections');
    expect(req.request.params.get('shiji_no')).toBe('SJ-0001');
    expect(req.request.params.get('hantei')).toBe('再検査');
    req.flush([]);
  });

  it('不良内容集計と製造指示一覧を取得する', () => {
    const summary: DefectSummary[] = [{ furyo_naiyo: '寸法不良', ken: 2 }];
    service.defectSummary().subscribe((rows) => expect(rows).toEqual(summary));
    httpMock.expectOne('/api/inspections/defect-summary').flush(summary);

    const orders: OrderForInspection[] = [{ shiji_no: 'SJ-0001', hinmoku_nm: 'フレームA' }];
    service.ordersForInspection().subscribe((rows) => expect(rows).toEqual(orders));
    httpMock.expectOne('/api/orders/for-inspection').flush(orders);
  });
});
