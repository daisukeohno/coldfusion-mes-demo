import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let component: App;
  let httpController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    httpController = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpController.expectOne('/api/orders').flush([
      {
        shiji_no: 'SJ-2608-0002',
        hinmoku_nm: 'インペラ 220mm',
      },
    ]);
    httpController.expectOne('/api/inspections').flush([
      {
        kensa_id: 12,
        shiji_no: 'SJ-2608-0002',
        hinmoku_nm: 'インペラ 220mm',
        line_cd: 'L-02',
        lot_no: 'LOT-A103',
        kensa_ymd: '2026-08-27',
        kensa_sha: '高橋 花子',
        sunpou: '220.010',
        kijun_min: '219.900',
        kijun_max: '220.100',
        hantei: 'OK',
        furyo_naiyo: '',
      },
    ]);
    httpController
      .expectOne('/api/inspections/defect-summary')
      .flush([{ furyo_naiyo: '外径寸法超過', ken: 1 }]);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpController.verify();
  });

  it('登録フォーム、履歴、不良集計、再検査ルールを表示する', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('品質検査');
    expect(text).toContain('SJ-2608-0002 / インペラ 220mm');
    expect(text).toContain('LOT-A103');
    expect(text).toContain('外径寸法超過');
    expect(text).toContain(
      '規格上限との差が 0.010mm 未満の場合は再検査 (2011年 暫定運用)',
    );
  });

  it('APIの判定結果を登録完了メッセージとして表示する', () => {
    component.form.controls.sunpou.setValue('220.100');
    component.submit();

    const createRequest = httpController.expectOne('/api/inspections');
    expect(createRequest.request.body.sunpou).toBe('220.100');
    createRequest.flush({
      kensa_id: 13,
      hantei: '再検査',
      message: '検査結果を登録しました。判定は 再検査 です。',
    });

    httpController.expectOne('/api/inspections').flush([]);
    httpController
      .expectOne('/api/inspections/defect-summary')
      .flush([{ furyo_naiyo: '外径寸法超過', ken: 1 }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'OK:検査結果を登録しました。判定は 再検査 です。',
    );
  });

  it('NGのみを選ぶと判定条件付きで履歴を再取得する', () => {
    component.applyFilter('NG');

    const request = httpController.expectOne(
      (candidate) =>
        candidate.url === '/api/inspections' &&
        candidate.params.get('hantei') === 'NG',
    );
    request.flush([]);

    expect(component.selectedFilter).toBe('NG');
  });
});
