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
    this.api.listShijiOrders().subscribe({
      next: (orders) => {
        this.shijiOrders = orders;
        if (!this.form.shiji_no && orders.length > 0) {
          this.form.shiji_no = orders[0].shiji_no;
        }
      },
      error: (error: HttpErrorResponse) => this.showError(error),
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
        // CFML 版はフォームが固定初期値で再描画されるため、同じ入力状態に戻す
        this.form.sunpou = '220.000';
        this.form.furyo_naiyo = '';
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

  /** CFML 版の inspection.cfm?shiji_no=... 相当の絞込 */
  filterByShijiNo(shijiNo: string): void {
    this.filterShijiNo = shijiNo;
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
    this.api.defectSummary().subscribe({
      next: (rows) => (this.defectSummary = rows),
      error: (error: HttpErrorResponse) => {
        this.defectSummary = [];
        this.showError(error);
      },
    });
  }

  private reloadList(): void {
    this.api
      .listInspections({ shiji_no: this.filterShijiNo, hantei: this.filterHantei })
      .subscribe({
        next: (rows) => (this.inspections = rows),
        error: (error: HttpErrorResponse) => {
          // 取得失敗時に古い一覧を残して正しい最新データに見せない
          this.inspections = [];
          this.showError(error);
        },
      });
  }

  private showError(error: HttpErrorResponse): void {
    this.message = this.extractErrorMessage(error);
    this.messageIsError = true;
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
