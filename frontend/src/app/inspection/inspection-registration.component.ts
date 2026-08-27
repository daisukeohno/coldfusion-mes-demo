import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InspectionApiService } from './inspection-api.service';
import { InspectionJudgmentService } from './inspection-judgment.service';
import { InspectionRefreshService } from './inspection-refresh.service';
import { InspectionRecord, ProductionOrder } from './inspection.types';

@Component({
  selector: 'app-inspection-registration',
  imports: [ReactiveFormsModule],
  templateUrl: './inspection-registration.component.html',
  styleUrl: './inspection-registration.component.css',
})
export class InspectionRegistrationComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(InspectionApiService);
  private readonly judgmentService = inject(InspectionJudgmentService);
  private readonly refreshService = inject(InspectionRefreshService);

  readonly form = this.formBuilder.nonNullable.group({
    shiji_no: ['', Validators.required],
    lot_no: [this.defaultLot()],
    kensa_sha: ['高橋 花子'],
    sunpou: ['220.000', Validators.required],
    kijun_min: ['219.900', Validators.required],
    kijun_max: ['220.100', Validators.required],
    furyo_naiyo: [''],
  });
  readonly orders = signal<ProductionOrder[]>([]);
  readonly preview = signal<string | null>(null);
  readonly result = signal<InspectionRecord | null>(null);
  readonly error = signal('');
  readonly loading = signal(false);

  ngOnInit(): void {
    this.updatePreview();
    this.form.valueChanges.subscribe(() => this.updatePreview());
    this.api.getProductionOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        if (!this.form.controls.shiji_no.value && orders.length) {
          this.form.controls.shiji_no.setValue(orders[0].shiji_no);
        }
      },
      error: () => this.error.set('製造指示の取得に失敗しました。'),
    });
  }

  submit(): void {
    this.error.set('');
    this.result.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.api.createInspection(this.form.getRawValue()).subscribe({
      next: (record) => {
        this.result.set(record);
        this.loading.set(false);
        this.refreshService.notify();
      },
      error: (error: { error?: { message?: string | string[] } }) => {
        const message = error.error?.message;
        this.error.set(Array.isArray(message)
          ? message.join(' ')
          : message || '検査結果の登録に失敗しました。');
        this.loading.set(false);
      },
    });
  }

  private updatePreview(): void {
    const values = this.form.getRawValue();
    this.preview.set(this.judgmentService.judge(
      values.sunpou,
      values.kijun_min,
      values.kijun_max,
    ));
  }

  private defaultLot(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `LOT-${month}${day}-01`;
  }
}
