import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { hanteiRowClass, hanteiTextClass } from './hantei-style';
import {
  DefectSummary,
  Hantei,
  InspectionRequest,
  KensaResult,
  OrderForInspection,
} from './inspection.model';
import { InspectionService } from './inspection.service';

/** 表示するメッセージ。ok=false は現行の class="ng" 表示に対応する。 */
export interface InspectionMessage {
  text: string;
  ok: boolean;
}

/** 現行 app/inspection.cfm 相当の画面。判定は API のレスポンスをそのまま表示する。 */
@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.css',
})
export class InspectionComponent implements OnInit {
  orders: OrderForInspection[] = [];
  kensaList: KensaResult[] = [];
  defectSummary: DefectSummary[] = [];
  message: InspectionMessage | null = null;
  hanteiFilter = '';
  form: InspectionRequest = {
    shiji_no: '',
    lot_no: defaultLotNo(new Date()),
    kensa_sha: '高橋 花子',
    sunpou: '220.000',
    kijun_min: '219.900',
    kijun_max: '220.100',
    furyo_naiyo: '',
  };

  constructor(private readonly inspectionService: InspectionService) {}

  ngOnInit(): void {
    this.inspectionService.ordersForInspection().subscribe((orders) => {
      this.orders = orders;
      if (!this.form.shiji_no && orders.length > 0) {
        this.form.shiji_no = orders[0].shiji_no;
      }
    });
    this.reload();
  }

  register(): void {
    this.inspectionService.register(this.form).subscribe({
      next: (response) => {
        this.message = { text: response.message, ok: response.hantei === 'OK' };
        this.reload();
      },
      error: (error: HttpErrorResponse) => {
        this.message = { text: errorText(error), ok: false };
      },
    });
  }

  /** 絞込リンク (すべて / NGのみ / 再検査のみ)。 */
  filterBy(hantei: string): void {
    this.hanteiFilter = hantei;
    this.reload();
  }

  rowClass(row: KensaResult, index: number): string {
    const byHantei = hanteiRowClass(row.hantei);
    if (byHantei) {
      return byHantei;
    }
    return index % 2 === 1 ? 'alt' : '';
  }

  textClass(hantei: Hantei): string {
    return hanteiTextClass(hantei);
  }

  /** 現行の numberFormat(x,"9.999") 相当。 */
  formatSunpou(value: number): string {
    return Number(value).toFixed(3);
  }

  private reload(): void {
    this.inspectionService
      .list({ hantei: this.hanteiFilter })
      .subscribe((rows) => (this.kensaList = rows));
    this.inspectionService.defectSummary().subscribe((rows) => (this.defectSummary = rows));
  }
}

/** 現行のデフォルト値 LOT-mmdd-01 と同じ。 */
function defaultLotNo(now: Date): string {
  const mm = `${now.getMonth() + 1}`.padStart(2, '0');
  const dd = `${now.getDate()}`.padStart(2, '0');
  return `LOT-${mm}${dd}-01`;
}

function errorText(error: HttpErrorResponse): string {
  const message = error.error?.message;
  return typeof message === 'string' && message.length > 0
    ? message
    : '登録に失敗しました。時間をおいて再度お試しください。';
}
