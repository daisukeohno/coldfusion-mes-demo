import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ApiError, InspectionCreatedResponse, ProductionOrderOption } from './inspection.models';
import { InspectionApiService } from './inspection-api.service';
import { previewJudgment } from './judgment';

interface Message {
  text: string;
  isError: boolean;
}

function defaultLotNo(today: Date): string {
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `LOT-${mm}${dd}-01`;
}

@Component({
  selector: 'app-inspection-form',
  imports: [ReactiveFormsModule],
  templateUrl: './inspection-form.component.html',
})
export class InspectionFormComponent {
  private readonly api = inject(InspectionApiService);
  private readonly fb = inject(FormBuilder);

  readonly productionOrders = input.required<ProductionOrderOption[]>();
  readonly selectedShijiNo = input('');
  readonly registered = output<InspectionCreatedResponse>();

  readonly message = signal<Message | null>(null);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    shiji_no: '',
    lot_no: defaultLotNo(new Date()),
    kensa_sha: '高橋 花子',
    sunpou: '220.000',
    kijun_min: '219.900',
    kijun_max: '220.100',
    furyo_naiyo: '',
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly preview = computed(() => {
    const v = this.formValue();
    return previewJudgment(v.sunpou ?? '', v.kijun_min ?? '', v.kijun_max ?? '');
  });

  constructor() {
    effect(() => {
      const orders = this.productionOrders();
      const selected = this.selectedShijiNo();
      const match = orders.find((o) => o.shiji_no === selected);
      this.form.controls.shiji_no.setValue(match?.shiji_no ?? orders[0]?.shiji_no ?? '');
    });
  }

  submit(): void {
    this.submitting.set(true);
    this.api.register(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.message.set({ text: response.message, isError: false });
        this.resetToDefaults();
        this.registered.emit(response);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const body = err.error as ApiError | null;
        this.message.set({
          text: body?.message ?? 'システムエラーが発生しました。管理者へ連絡してください。',
          isError: true,
        });
      },
    });
  }

  private resetToDefaults(): void {
    this.form.reset({
      shiji_no: this.productionOrders()[0]?.shiji_no ?? '',
      lot_no: defaultLotNo(new Date()),
    });
  }
}
