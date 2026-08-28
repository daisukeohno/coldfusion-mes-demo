import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  type CreateInspectionRequest,
  InspectionService,
} from './inspection.service';

describe('InspectionService', () => {
  let service: InspectionService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InspectionService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('登録リクエストをREST APIへ送信する', () => {
    const body: CreateInspectionRequest = {
      shiji_no: 'SJ-2608-0002',
      lot_no: 'LOT-A104',
      kensa_sha: '高橋 花子',
      sunpou: '220.100',
      kijun_min: '219.900',
      kijun_max: '220.100',
      furyo_naiyo: '',
    };

    service.createInspection(body).subscribe((response) => {
      expect(response.hantei).toBe('再検査');
    });

    const request = httpController.expectOne('/api/inspections');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({
      kensa_id: 13,
      hantei: '再検査',
      message: '検査結果を登録しました。判定は 再検査 です。',
    });
  });

  it('判定をクエリパラメータにして履歴を取得する', () => {
    service.getInspections({ hantei: 'NG' }).subscribe();

    const request = httpController.expectOne(
      (candidate) =>
        candidate.url === '/api/inspections' &&
        candidate.params.get('hantei') === 'NG',
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
