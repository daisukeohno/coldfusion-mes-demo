import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrdersApiService } from './orders-api.service';
import { Order, OrderFilter } from './orders.model';

const DEFAULT_SORT = 'noki_ymd';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
})
export class OrdersComponent implements OnInit {
  /** 検索フォームの入力値 (未検索の状態では絞込に反映しない) */
  form: { kw: string; status: string; line: string } = { kw: '', status: '', line: '' };

  /** 実際に適用されている絞込条件 */
  applied: OrderFilter = { kw: '', status: '', line: '', sort: DEFAULT_SORT };

  statusList: string[] = [];
  lineList: string[] = [];

  orders: Order[] = [];
  recordCount = 0;

  message = '';
  loading = false;

  constructor(private readonly api: OrdersApiService) {}

  ngOnInit(): void {
    this.api.searchOptions().subscribe({
      next: (options) => {
        this.statusList = options.statusList;
        this.lineList = options.lineList;
      },
      error: (error: HttpErrorResponse) => this.showError(error),
    });
    this.reload();
  }

  search(): void {
    this.applied = { ...this.form, sort: this.applied.sort };
    this.reload();
  }

  /** orders.cfm の「クリア」ボタン (orders.cfm へ遷移し全条件が初期化される) */
  clear(): void {
    this.form = { kw: '', status: '', line: '' };
    this.applied = { kw: '', status: '', line: '', sort: DEFAULT_SORT };
    this.reload();
  }

  /**
   * ヘッダの並び替えリンク。CFML 版は orders.cfm?sort=... へ遷移するため
   * キーワード・状態・ラインの絞込も同時に解除される。挙動をそのまま再現する。
   */
  sortBy(column: string): void {
    this.form = { kw: '', status: '', line: '' };
    this.applied = { kw: '', status: '', line: '', sort: column };
    this.reload();
  }

  /** 納期遅れ行は late、それ以外は偶数行を alt にする (CFML の currentRow MOD 2) */
  rowClass(row: Order, index: number): string {
    if (row.okure) {
      return 'late';
    }
    return (index + 1) % 2 === 0 ? 'alt' : '';
  }

  /** numberFormat(value, ",") 相当 */
  formatNumber(value: number): string {
    return Number(value ?? 0).toLocaleString('en-US');
  }

  /** dateFormat(value, "yyyy/mm/dd") 相当 */
  formatDate(value: string): string {
    return value ? value.slice(0, 10).replace(/-/g, '/') : '';
  }

  private reload(): void {
    this.loading = true;
    this.api.listOrders(this.applied).subscribe({
      next: (result) => {
        this.loading = false;
        this.message = '';
        this.orders = result.rows;
        this.recordCount = result.recordCount;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        // 取得失敗時に古い一覧を残して最新データに見せない
        this.orders = [];
        this.recordCount = 0;
        this.showError(error);
      },
    });
  }

  private showError(error: HttpErrorResponse): void {
    this.message = this.extractErrorMessage(error);
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
