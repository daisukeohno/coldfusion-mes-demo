import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  type DefectSummary,
  type InspectionJudgment,
  type InspectionRecord,
  InspectionService,
  type OrderOption,
} from './services/inspection.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly inspectionService = inject(InspectionService);

  readonly form = this.formBuilder.nonNullable.group({
    shiji_no: ['', Validators.required],
    lot_no: [this.defaultLotNumber()],
    kensa_sha: ['高橋 花子', Validators.required],
    sunpou: ['220.000', Validators.required],
    kijun_min: ['219.900', Validators.required],
    kijun_max: ['220.100', Validators.required],
    furyo_naiyo: [''],
  });

  orders: OrderOption[] = [];
  inspections: InspectionRecord[] = [];
  defectSummary: DefectSummary[] = [];
  selectedFilter: '' | Exclude<InspectionJudgment, 'OK'> = '';
  resultMessage = '';
  errorMessage = '';
  loading = true;
  submitting = false;

  ngOnInit(): void {
    forkJoin({
      orders: this.inspectionService.getOrders(),
      inspections: this.inspectionService.getInspections(),
      defectSummary: this.inspectionService.getDefectSummary(),
    }).subscribe({
      next: ({ orders, inspections, defectSummary }) => {
        this.orders = orders;
        this.inspections = inspections;
        this.defectSummary = defectSummary;
        if (orders.length > 0) {
          this.form.controls.shiji_no.setValue(orders[0].shiji_no);
        }
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.apiError(error);
        this.loading = false;
      },
    });
  }

  submit(): void {
    this.resultMessage = '';
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = '必須項目を入力してください。';
      return;
    }

    this.submitting = true;
    this.inspectionService.createInspection(this.form.getRawValue()).subscribe({
      next: (result) => {
        this.resultMessage = `OK:${result.message}`;
        this.submitting = false;
        this.reloadResults();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.apiError(error);
        this.submitting = false;
      },
    });
  }

  applyFilter(filter: '' | Exclude<InspectionJudgment, 'OK'>): void {
    this.selectedFilter = filter;
    this.loadInspections();
  }

  judgmentClass(judgment: InspectionJudgment): string {
    if (judgment === 'NG') {
      return 'judgment judgment-ng';
    }
    if (judgment === '再検査') {
      return 'judgment judgment-recheck';
    }
    return 'judgment judgment-ok';
  }

  private reloadResults(): void {
    forkJoin({
      inspections: this.inspectionService.getInspections(
        this.selectedFilter ? { hantei: this.selectedFilter } : {},
      ),
      defectSummary: this.inspectionService.getDefectSummary(),
    }).subscribe({
      next: ({ inspections, defectSummary }) => {
        this.inspections = inspections;
        this.defectSummary = defectSummary;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.apiError(error);
      },
    });
  }

  private loadInspections(): void {
    this.loading = true;
    this.inspectionService
      .getInspections(
        this.selectedFilter ? { hantei: this.selectedFilter } : {},
      )
      .subscribe({
        next: (inspections) => {
          this.inspections = inspections;
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.apiError(error);
          this.loading = false;
        },
      });
  }

  private apiError(error: HttpErrorResponse): string {
    return typeof error.error?.error === 'string'
      ? error.error.error
      : 'APIとの通信に失敗しました。';
  }

  private defaultLotNumber(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `LOT-${month}${day}-01`;
  }
}
