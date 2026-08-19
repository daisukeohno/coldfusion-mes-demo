import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InspectionApiService } from './inspection-api.service';
import {
  CreateInspectionRequest,
  DefectSummary,
  Inspection,
  ShijiOrder,
} from './inspection.model';

function todayLotNo(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `LOT-${mm}${dd}-01`;
}

@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.css',
})
export class InspectionComponent implements OnInit {
  form: CreateInspectionRequest = {
    shiji_no: '',
    lot_no: todayLotNo(),
    kensa_sha: '高橋 花子',
    sunpou: '220.000',
    kijun_min: '219.900',
    kijun_max: '220.100',
    furyo_naiyo: '',
  };

  shijiOrders: ShijiOrder[] = [];
  inspections: Inspection[] = [];
  defectSummary: DefectSummary[] = [];

  filterShijiNo = '';
  filterHantei = '';

  message = '';
  /** true の場合はエラーメッセージ (CFML の "NG:" プレフィックス相当) */
  messageIsError = false;
  submitting = false;

  constructor(private readonly api: InspectionApiService) {}

  ngOnInit(): void {
    this.api.listShijiOrders().subscribe((orders) => {
      this.shijiOrders = orders;
      if (!this.form.shiji_no && orders.length > 0) {
        this.form.shiji_no = orders[0].shiji_no;
      }
    });
    this.reload();
  }

  /** 判定はサーバ側で確定する。画面はレスポンスの hantei を表示するだけ */
  submit(): void {
    this.submitting = true;
    this.api.createInspection(this.form).subscribe({
      next: (result) => {
        this.submitting = false;
        this.message = result.message;
        this.messageIsError = false;
        this.reload();
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.message = this.extractErrorMessage(error);
        this.messageIsError = true;
      },
    });
  }

  filter(hantei: string): void {
    this.filterHantei = hantei;
    this.reloadList();
  }

  clearFilter(): void {
    this.filterShijiNo = '';
    this.filterHantei = '';
    this.reloadList();
  }

  rowClass(row: Inspection, index: number): string {
    if (row.hantei === 'NG') {
      return 'late';
    }
    if (row.hantei === '再検査') {
      return 'warn';
    }
    return (index + 1) % 2 === 0 ? 'alt' : '';
  }

  formatDecimal(value: string): string {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(3) : value;
  }

  formatDate(value: string): string {
    return value ? value.slice(0, 10).replace(/-/g, '/') : '';
  }

  private reload(): void {
    this.reloadList();
    this.api.defectSummary().subscribe((rows) => (this.defectSummary = rows));
  }

  private reloadList(): void {
    this.api
      .listInspections({ shiji_no: this.filterShijiNo, hantei: this.filterHantei })
      .subscribe((rows) => (this.inspections = rows));
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const body = error.error as { message?: string | string[] } | string | null;
    if (typeof body === 'string' && body) {
      return body;
    }
    if (body && typeof body === 'object' && body.message) {
      return Array.isArray(body.message) ? body.message.join(' / ') : body.message;
    }
    return 'システムエラーが発生しました。管理者へ連絡してください。';
  }
}
