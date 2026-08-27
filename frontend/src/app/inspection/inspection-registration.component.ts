import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InspectionApiService } from './inspection-api.service';
import { InspectionJudgmentService } from './inspection-judgment.service';
import { InspectionRecord, ProductionOrder } from './inspection.types';

@Component({
  selector: 'app-inspection-registration',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inspection-registration.component.html',
  styleUrl: './inspection-registration.component.css',
})
export class InspectionRegistrationComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(InspectionApiService);
  private readonly judgmentService = inject(InspectionJudgmentService);

  readonly form = this.formBuilder.nonNullable.group({
    shiji_no: ['', Validators.required],
    lot_no: [this.defaultLot()],
    kensa_sha: ['高橋 花子'],
    sunpou: ['220.000', Validators.required],
    kijun_min: ['219.900', Validators.required],
    kijun_max: ['220.100', Validators.required],
    furyo_naiyo: [''],
  });
  orders: ProductionOrder[] = [];
  preview: string | null = null;
  result: InspectionRecord | null = null;
  error = '';
  loading = false;

  ngOnInit(): void {
    this.updatePreview();
    this.form.valueChanges.subscribe(() => this.updatePreview());
    this.api.getProductionOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        if (!this.form.controls.shiji_no.value && orders.length) {
          this.form.controls.shiji_no.setValue(orders[0].shiji_no);
        }
      },
      error: () => (this.error = '製造指示の取得に失敗しました。'),
    });
  }

  submit(): void {
    this.error = '';
    this.result = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.api.createInspection(this.form.getRawValue()).subscribe({
      next: (record) => {
        this.result = record;
        this.loading = false;
      },
      error: (error: { error?: { message?: string | string[] } }) => {
        const message = error.error?.message;
        this.error = Array.isArray(message)
          ? message.join(' ')
          : message || '検査結果の登録に失敗しました。';
        this.loading = false;
      },
    });
  }

  private updatePreview(): void {
    const values = this.form.getRawValue();
    this.preview = this.judgmentService.judge(
      values.sunpou,
      values.kijun_min,
      values.kijun_max,
    );
  }

  private defaultLot(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `LOT-${month}${day}-01`;
  }
}
