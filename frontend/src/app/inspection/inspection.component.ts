import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InspectionApiService } from './inspection-api.service';
import {
  ApiError,
  DefectSummary,
  Hantei,
  InspectionRecord,
  InspectionRequest,
  OrderOption,
} from './inspection.model';

/** 旧 app/inspection.cfm (品質検査 入力/一覧) の Angular 版。判定は API に委ねる。 */
@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.css',
})
export class InspectionComponent implements OnInit {
  readonly orders = signal<OrderOption[]>([]);
  readonly records = signal<InspectionRecord[]>([]);
  readonly summary = signal<DefectSummary[]>([]);
  readonly message = signal<{ ok: boolean; text: string } | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly submitting = signal(false);

  readonly hanteiFilter = signal<Hantei | ''>('');
  readonly shijiFilter = signal('');

  form: InspectionRequest = {
    shiji_no: '',
    lot_no: `LOT-${defaultLotSuffix()}-01`,
    kensa_sha: '高橋 花子',
    sunpou: '220.000',
    kijun_min: '219.900',
    kijun_max: '220.100',
    furyo_naiyo: '',
  };

  constructor(private readonly api: InspectionApiService) {}

  ngOnInit(): void {
    this.api.listOrders().subscribe((orders) => {
      this.orders.set(orders);
      if (!this.form.shiji_no && orders.length > 0) {
        this.form.shiji_no = orders[0].shiji_no;
      }
    });
    this.reload();
  }

  reload(): void {
    this.api
      .listInspections({ shiji_no: this.shijiFilter(), hantei: this.hanteiFilter() })
      .subscribe((rows) => this.records.set(rows));
    this.api.defectSummary().subscribe((rows) => this.summary.set(rows));
  }

  setFilter(hantei: Hantei | ''): void {
    this.hanteiFilter.set(hantei);
    this.reload();
  }

  setShijiFilter(shijiNo: string): void {
    this.shijiFilter.set(shijiNo);
    this.reload();
  }

  submit(): void {
    this.submitting.set(true);
    this.message.set(null);
    this.fieldErrors.set({});
    this.api.register(this.form).subscribe({
      next: (rec) => {
        this.message.set({ ok: true, text: `検査結果を登録しました。判定は ${rec.hantei} です。` });
        this.submitting.set(false);
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        const body = err.error as Partial<ApiError> | undefined;
        const errors = body?.errors ?? {};
        this.fieldErrors.set(errors);
        const first = Object.values(errors)[0];
        this.message.set({ ok: false, text: first ?? body?.message ?? '登録に失敗しました。' });
        this.submitting.set(false);
      },
    });
  }

  rowClass(rec: InspectionRecord, index: number): string {
    if (rec.hantei === 'NG') {
      return 'late';
    }
    if (rec.hantei === '再検査') {
      return 'warn';
    }
    return index % 2 === 1 ? 'alt' : '';
  }
}

function defaultLotSuffix(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${mm}${dd}`;
}
