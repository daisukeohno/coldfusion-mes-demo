import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectionComponent } from './inspection.component';

describe('InspectionComponent', () => {
  let fixture: ComponentFixture<InspectionComponent>;
  let component: InspectionComponent;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InspectionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(InspectionComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function flushInitialRequests(): void {
    fixture.detectChanges();
    httpMock
      .expectOne('/api/orders/for-inspection')
      .flush([{ shiji_no: 'SJ-0002', hinmoku_nm: 'カバーB' }, { shiji_no: 'SJ-0001', hinmoku_nm: 'フレームA' }]);
    httpMock.expectOne('/api/inspections').flush([]);
    httpMock.expectOne('/api/inspections/defect-summary').flush([]);
  }

  it('現行画面と同じ初期値を表示し、先頭の製造指示を選択する', () => {
    expect(component.form.kijun_min).toBe('219.900');
    expect(component.form.kijun_max).toBe('220.100');
    expect(component.form.sunpou).toBe('220.000');
    expect(component.form.kensa_sha).toBe('高橋 花子');

    flushInitialRequests();

    expect(component.form.shiji_no).toBe('SJ-0002');
  });

  it('登録レスポンスの判定をメッセージ表示する (再検査は警告扱い)', () => {
    flushInitialRequests();

    component.register();
    httpMock.expectOne('/api/inspections').flush({
      hantei: '再検査',
      message: '検査結果を登録しました。判定は 再検査 です。',
      kensa: null,
    });
    httpMock.expectOne('/api/inspections').flush([]);
    httpMock.expectOne('/api/inspections/defect-summary').flush([]);

    expect(component.message).toEqual({
      text: '検査結果を登録しました。判定は 再検査 です。',
      ok: false,
    });
  });

  it('OK 判定はエラー表示にしない', () => {
    flushInitialRequests();

    component.register();
    httpMock
      .expectOne('/api/inspections')
      .flush({ hantei: 'OK', message: '検査結果を登録しました。判定は OK です。', kensa: null });
    httpMock.expectOne('/api/inspections').flush([]);
    httpMock.expectOne('/api/inspections/defect-summary').flush([]);

    expect(component.message?.ok).toBeTrue();
  });

  it('非数値の測定値は API のエラーメッセージを表示する', () => {
    flushInitialRequests();

    component.form.sunpou = 'abc';
    component.register();
    httpMock
      .expectOne('/api/inspections')
      .flush({ message: '測定値は数値で入力してください。' }, { status: 400, statusText: 'Bad Request' });

    expect(component.message).toEqual({ text: '測定値は数値で入力してください。', ok: false });
  });

  it('絞込リンクで hantei をクエリに載せて再取得する', () => {
    flushInitialRequests();

    component.filterBy('NG');
    const req = httpMock.expectOne((r) => r.url === '/api/inspections' && r.params.get('hantei') === 'NG');
    req.flush([]);
    httpMock.expectOne('/api/inspections/defect-summary').flush([]);

    component.filterBy('');
    const all = httpMock.expectOne('/api/inspections');
    expect(all.request.params.keys().length).toBe(0);
    all.flush([]);
    httpMock.expectOne('/api/inspections/defect-summary').flush([]);
  });

  it('行の色分けは判定優先、それ以外は交互行', () => {
    const row = (hantei: 'OK' | 'NG' | '再検査') => ({ hantei }) as never;
    expect(component.rowClass(row('NG'), 0)).toBe('late');
    expect(component.rowClass(row('再検査'), 0)).toBe('warn');
    expect(component.rowClass(row('OK'), 1)).toBe('alt');
    expect(component.rowClass(row('OK'), 0)).toBe('');
  });

  it('測定値は小数3桁で表示する', () => {
    expect(component.formatSunpou(220.1)).toBe('220.100');
  });
});
