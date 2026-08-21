import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { InspectionService } from './inspection.service';
import {
  DefectSummary,
  InspectionRecord,
  InspectionRequest,
  InspectionResponse,
  OrderOption
} from './inspection.model';

/** 指示番号リンク先の現行 (ColdFusion) 画面。並行稼働のため詳細画面は現行を参照する。 */
export const LEGACY_APP_BASE_URL = 'http://localhost:8888';

@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.css'
})
export class InspectionComponent implements OnInit {
  readonly legacyBaseUrl = LEGACY_APP_BASE_URL;

  orders: OrderOption[] = [];
  records: InspectionRecord[] = [];
  defects: DefectSummary[] = [];

  hanteiFilter = '';
  message = '';
  messageIsError = false;

  form: InspectionRequest = {
    shiji_no: '',
    lot_no: this.defaultLotNo(),
    kensa_sha: '高橋 花子',
    sunpou: '220.000',
    kijun_min: '219.900',
    kijun_max: '220.100',
    furyo_naiyo: ''
  };

  constructor(private readonly inspectionService: InspectionService) {}

  ngOnInit(): void {
    this.inspectionService.getOrdersForInspection().subscribe((orders) => {
      this.orders = orders;
      if (!this.form.shiji_no && orders.length > 0) {
        this.form.shiji_no = orders[0].shiji_no;
      }
    });
    this.reload();
  }

  setFilter(hantei: string): void {
    this.hanteiFilter = hantei;
    this.reload();
  }

  register(): void {
    this.inspectionService.register(this.form).subscribe({
      next: (response: InspectionResponse) => {
        this.showMessage(response.message, false);
        this.reload();
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error as InspectionResponse | null;
        this.showMessage(body?.message ?? '登録に失敗しました。', true);
      }
    });
  }

  rowClass(record: InspectionRecord, index: number): string {
    if (record.hantei === 'NG') {
      return 'late';
    }
    if (record.hantei === '再検査') {
      return 'warn';
    }
    // 現行 CFML の currentRow (1 始まり) が偶数の行を交互行として塗る
    return (index + 1) % 2 === 0 ? 'alt' : '';
  }

  /** 現行の numberFormat(x,"9.999") 相当 */
  formatMm(value: number): string {
    return Number(value).toFixed(3);
  }

  private reload(): void {
    this.inspectionService.getInspections('', this.hanteiFilter).subscribe((records) => {
      this.records = records;
    });
    this.inspectionService.getDefectSummary().subscribe((defects) => {
      this.defects = defects;
    });
  }

  private showMessage(message: string, isError: boolean): void {
    this.message = message;
    this.messageIsError = isError;
  }

  private defaultLotNo(): string {
    const now = new Date();
    const mm = `${now.getMonth() + 1}`.padStart(2, '0');
    const dd = `${now.getDate()}`.padStart(2, '0');
    return `LOT-${mm}${dd}-01`;
  }
}
