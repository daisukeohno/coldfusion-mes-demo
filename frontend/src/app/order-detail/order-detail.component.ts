import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InspectionApiService } from '../inspection/inspection-api.service';
import { ShijiOrder } from '../inspection/inspection.model';
import { OrderDetailApiService } from './order-detail-api.service';
import {
  OrderDetail,
  OrderDetailInspection,
  OrderDetailProcess,
} from './order-detail.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css',
})
export class OrderDetailComponent implements OnInit {
  shijiOrders: ShijiOrder[] = [];
  selectedShijiNo = '';
  detail: OrderDetail | null = null;
  message = '';
  messageIsError = false;
  loading = false;
  private queryShijiNo = '';

  constructor(
    private readonly api: OrderDetailApiService,
    private readonly inspectionApi: InspectionApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.queryShijiNo = params.get('shiji_no') ?? '';
      if (this.queryShijiNo) {
        this.selectedShijiNo = this.queryShijiNo;
        this.reload();
      } else {
        this.selectedShijiNo = '';
        this.detail = null;
        this.setMissingShijiMessage();
      }
    });
    this.inspectionApi.listShijiOrders().subscribe({
      next: (orders) => {
        this.shijiOrders = orders;
      },
      error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  selectShijiNo(shijiNo: string): void {
    this.selectedShijiNo = shijiNo;
    if (!shijiNo) {
      this.detail = null;
      this.setMissingShijiMessage();
    }
    void this.router.navigate([], {
      queryParams: { shiji_no: shijiNo || null },
      queryParamsHandling: 'merge',
    });
  }

  processRowClass(index: number): string {
    return (index + 1) % 2 === 0 ? 'alt' : '';
  }

  inspectionRowClass(row: OrderDetailInspection, index: number): string {
    if (row.hantei === 'NG') {
      return 'late';
    }
    return (index + 1) % 2 === 0 ? 'alt' : '';
  }

  inspectionClass(row: OrderDetailInspection): string {
    return row.hantei === 'OK' ? 'ok' : 'ng';
  }

  formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) {
      return '';
    }
    return Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  formatFixed(value: string | null, digits: number): string {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) {
      return '';
    }
    return Number(value).toFixed(digits);
  }

  formatDate(value: string | null): string {
    return value ? value.slice(0, 10).replace(/-/g, '/') : '';
  }

  formatMonthDate(value: string | null): string {
    return value ? value.slice(5, 10).replace('-', '/') : '';
  }

  formatDateTime(value: string | null): string {
    return value ? value.slice(0, 16).replace(/-/g, '/') : '';
  }

  formatMonthDateTime(value: string | null): string {
    return value ? `${value.slice(5, 10).replace('-', '/')} ${value.slice(11, 16)}` : '';
  }

  equipment(row: OrderDetailProcess): string {
    return `${row.setsubi_cd ?? ''}${row.setsubi_nm ? ` ${row.setsubi_nm}` : ''}`;
  }

  hasDefect(value: number | null): boolean {
    return Number(value) > 0;
  }

  private reload(): void {
    if (!this.selectedShijiNo) {
      return;
    }
    this.loading = true;
    this.api.getOrderDetail(this.selectedShijiNo).subscribe({
      next: (detail) => {
        this.loading = false;
        this.detail = detail;
        this.message = '';
        this.messageIsError = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.detail = null;
        this.showError(error);
      },
    });
  }

  private showError(error: HttpErrorResponse): void {
    this.message = this.extractErrorMessage(error);
    this.messageIsError = true;
  }

  private setMissingShijiMessage(): void {
    this.message = '指示番号  は登録されていません。';
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
