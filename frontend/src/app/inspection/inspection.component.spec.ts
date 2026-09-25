import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InspectionComponent } from './inspection.component';
import { InspectionRecord } from './inspection.model';

const record = (over: Partial<InspectionRecord>): InspectionRecord => ({
  kensa_id: 1,
  shiji_no: 'S-0001',
  hinmoku_nm: 'ポンプケーシング A',
  line_cd: 'L1',
  lot_no: 'LOT-0101-01',
  kensa_ymd: '2025-03-15',
  kensa_sha: '高橋 花子',
  sunpou: 220.0,
  kijun_min: 219.9,
  kijun_max: 220.1,
  hantei: 'OK',
  furyo_naiyo: '',
  ...over,
});

describe('InspectionComponent', () => {
  let fixture: ComponentFixture<InspectionComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(InspectionComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function flushInitialLoad(records: InspectionRecord[] = []) {
    http.expectOne('/api/orders').flush([{ shiji_no: 'S-0001', hinmoku_nm: 'ポンプケーシング A' }]);
    http.expectOne((r) => r.url === '/api/inspections').flush(records);
    http.expectOne('/api/inspections/defect-summary').flush([{ furyo_naiyo: '寸法過大', ken: 3 }]);
    fixture.detectChanges();
  }

  it('shows the 2011 provisional rule note', () => {
    flushInitialLoad();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.note')?.textContent).toContain('0.010mm 未満の場合は「再検査」');
    expect(el.querySelector('.note')?.textContent).toContain('2011年 暫定運用');
  });

  it('styles NG rows as late and 再検査 rows as warn', () => {
    flushInitialLoad([
      record({ kensa_id: 3, hantei: 'NG', furyo_naiyo: '寸法過大' }),
      record({ kensa_id: 2, hantei: '再検査' }),
      record({ kensa_id: 1, hantei: 'OK' }),
    ]);
    const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('table.grid tr')).slice(1, 4);
    expect(rows[0].classList).toContain('late');
    expect(rows[1].classList).toContain('warn');
    expect(rows[2].classList).not.toContain('late');
    expect(rows[2].querySelector('.ok')?.textContent).toBe('OK');
  });

  it('filters by hantei via the API (no client-side judgment)', () => {
    flushInitialLoad();
    fixture.componentInstance.setFilter('NG');
    const req = http.expectOne((r) => r.url === '/api/inspections');
    expect(req.request.params.get('hantei')).toBe('NG');
    req.flush([]);
    http.expectOne('/api/inspections/defect-summary').flush([]);
  });

  it('displays the hantei returned by POST /api/inspections', () => {
    flushInitialLoad();
    fixture.componentInstance.form.sunpou = '220.095';
    fixture.componentInstance.submit();
    const post = http.expectOne({ method: 'POST', url: '/api/inspections' });
    expect(post.request.body.sunpou).toBe('220.095');
    post.flush(record({ hantei: '再検査' }), { status: 201, statusText: 'Created' });
    http.expectOne((r) => r.url === '/api/inspections').flush([]);
    http.expectOne('/api/inspections/defect-summary').flush([]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.box b')?.textContent).toContain('判定は 再検査 です');
  });

  it('shows the validation error from the API for non-numeric sunpou', () => {
    flushInitialLoad();
    fixture.componentInstance.form.sunpou = 'abc';
    fixture.componentInstance.submit();
    http.expectOne({ method: 'POST', url: '/api/inspections' }).flush(
      { message: '入力内容に誤りがあります。', errors: { sunpou: '測定値は数値で入力してください。' } },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();
    const msg = (fixture.nativeElement as HTMLElement).querySelector('.box b');
    expect(msg?.textContent).toContain('測定値は数値で入力してください。');
    expect(msg?.classList).toContain('ng');
  });
});
