import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { InspectionApiService } from './inspection-api.service';
import { InspectionJudgmentService } from './inspection-judgment.service';
import {
  CreateInspectionRequest,
  DefectSummary,
  Inspection,
  InspectionFilter,
  ShijiOption,
} from './inspection.models';

function defaultLotNo(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `LOT-${mm}${dd}-01`;
}

@Component({
  selector: 'app-inspection',
  imports: [FormsModule],
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.css',
})
export class InspectionComponent implements OnInit {
  private readonly api = inject(InspectionApiService);
  private readonly judgment = inject(InspectionJudgmentService);

  readonly shijiList = signal<ShijiOption[]>([]);
  readonly inspections = signal<Inspection[]>([]);
  readonly defects = signal<DefectSummary[]>([]);
  readonly filter = signal<InspectionFilter>({});
  readonly message = signal<{ ok: boolean; text: string } | null>(null);
  readonly submitting = signal(false);

  readonly form = signal<CreateInspectionRequest>({
    shiji_no: '',
    lot_no: defaultLotNo(),
    kensa_sha: '高橋 花子',
    sunpou: '220.000',
    kijun_min: '219.900',
    kijun_max: '220.100',
    furyo_naiyo: '',
  });

  /** 入力中の即時プレビュー。登録時の正式判定はサーバ結果 */
  readonly preview = computed(() => {
    const f = this.form();
    return this.judgment.judge(f.sunpou, f.kijun_min, f.kijun_max);
  });

  ngOnInit(): void {
    this.api.listShiji().subscribe((list) => {
      this.shijiList.set(list);
      if (!this.form().shiji_no && list.length) {
        this.patch({ shiji_no: list[0].shiji_no });
      }
    });
    this.reload();
  }

  patch(p: Partial<CreateInspectionRequest>): void {
    this.form.update((f) => ({ ...f, ...p }));
  }

  setFilter(hantei?: string): void {
    this.filter.update((f) => ({ ...f, hantei }));
    this.reload();
  }

  reload(): void {
    this.api.listInspections(this.filter()).subscribe((rows) => this.inspections.set(rows));
    this.api.defectSummary().subscribe((rows) => this.defects.set(rows));
  }

  submit(): void {
    this.submitting.set(true);
    this.message.set(null);
    this.api.register(this.form()).subscribe({
      next: (res) => {
        this.message.set({ ok: true, text: res.message });
        this.submitting.set(false);
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        const body = err.error as { message?: string | string[] } | undefined;
        const text = Array.isArray(body?.message)
          ? body.message.join(' / ')
          : (body?.message ?? '登録に失敗しました。');
        this.message.set({ ok: false, text });
        this.submitting.set(false);
      },
    });
  }

  rowClass(row: Inspection, index: number): string {
    if (row.hantei === 'NG') return 'late';
    if (row.hantei === '再検査') return 'warn';
    return index % 2 === 1 ? 'alt' : '';
  }

  fmtDate(ymd: string | null): string {
    return ymd ? ymd.slice(0, 10).replaceAll('-', '/') : '';
  }

  fmtNum(v: string): string {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(3) : v;
  }
}
