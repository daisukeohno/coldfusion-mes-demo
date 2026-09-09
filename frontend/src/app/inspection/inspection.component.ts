import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InspectionApiService } from './inspection-api.service';
import {
  CreateInspectionRequest,
  DefectSummary,
  HanteiFilter,
  Inspection,
  OrderOption,
} from './inspection.models';

/**
 * 現行 app/inspection.cfm の画面。判定 (OK/NG/再検査) は API 側で行い、ここでは結果を表示するだけ。
 */
@Component({
  selector: 'app-inspection',
  imports: [FormsModule],
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.css',
})
export class InspectionComponent implements OnInit {
  private readonly api = inject(InspectionApiService);

  readonly orders = signal<OrderOption[]>([]);
  readonly inspections = signal<Inspection[]>([]);
  readonly defects = signal<DefectSummary[]>([]);
  readonly hanteiFilter = signal<HanteiFilter>('');
  readonly message = signal<{ text: string; ok: boolean } | null>(null);
  readonly submitting = signal(false);

  form: CreateInspectionRequest = {
    shiji_no: '',
    lot_no: `LOT-${this.mmdd()}-01`,
    kensa_sha: '高橋 花子',
    sunpou: '220.000',
    kijun_min: '219.900',
    kijun_max: '220.100',
    furyo_naiyo: '',
  };

  ngOnInit(): void {
    this.api.orders().subscribe((orders) => {
      this.orders.set(orders);
      if (!this.form.shiji_no && orders.length) this.form.shiji_no = orders[0].shiji_no;
    });
    this.reload();
  }

  setFilter(hantei: HanteiFilter): void {
    this.hanteiFilter.set(hantei);
    this.reload();
  }

  submit(): void {
    this.submitting.set(true);
    this.api.create({ ...this.form }).subscribe({
      next: (res) => {
        this.message.set({ text: res.message, ok: true });
        this.submitting.set(false);
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        const text =
          typeof err.error?.message === 'string' ? err.error.message : '登録に失敗しました。';
        this.message.set({ text, ok: false });
        this.submitting.set(false);
      },
    });
  }

  rowClass(row: Inspection, index: number): string {
    if (row.hantei === 'NG') return 'late';
    if (row.hantei === '再検査') return 'warn';
    return index % 2 === 1 ? 'alt' : '';
  }

  private reload(): void {
    this.api.list({ hantei: this.hanteiFilter() }).subscribe((rows) => this.inspections.set(rows));
    this.api.defectSummary().subscribe((rows) => this.defects.set(rows));
  }

  private mmdd(): string {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }
}
