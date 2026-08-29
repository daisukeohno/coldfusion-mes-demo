import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from './inventory-api.service';
import { InventoryItem, MovementMode, WarehouseSummary } from './inventory.model';

/** CFML の numberFormat(値, ",") 相当。整数へ丸めて3桁区切りにする */
function numberFormat(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const text = typeof value === 'number' ? value.toString() : value.trim();
  const matched = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(text);
  if (!matched || (matched[2] === '' && (matched[3] ?? '') === '')) {
    return text;
  }
  const sign = matched[1] === '-' ? '-' : '';
  let integer = Number(matched[2] || '0');
  const frac = matched[3] ?? '';
  if (frac !== '') {
    // Java の DecimalFormat と同じ HALF_EVEN で整数へ丸める
    const head = Number(frac[0]);
    const tailHasValue = /[1-9]/.test(frac.slice(1));
    if (head > 5 || (head === 5 && (tailHasValue || integer % 2 === 1))) {
      integer += 1;
    }
  }
  return sign + integer.toLocaleString('en-US');
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit {
  items: InventoryItem[] = [];
  warehouses: WarehouseSummary[] = [];
  buhinKen = 0;
  totalKingaku = '0.00';

  filterSouko = '';

  /** 行ごとの入出庫数。CFML 版と同じく初期値は 10 */
  quantities: Record<string, string> = {};

  message = '';
  /** true の場合はエラーメッセージ (CFML の "NG:" プレフィックス相当) */
  messageIsError = false;
  submitting = false;

  constructor(private readonly api: InventoryApiService) {}

  ngOnInit(): void {
    this.reload();
  }

  /** CFML 版の inventory.cfm?souko=... 相当の絞込 */
  filterBySouko(souko: string): void {
    this.filterSouko = souko;
    this.reloadItems();
  }

  rowKey(row: InventoryItem): string {
    return `${row.buhin_cd}|${row.souko_cd}`;
  }

  quantityOf(row: InventoryItem): string {
    return this.quantities[this.rowKey(row)] ?? '10';
  }

  setQuantity(row: InventoryItem, value: string): void {
    this.quantities[this.rowKey(row)] = value;
  }

  /** 在庫数の更新はサーバ側で行い、画面は再取得した結果を表示する */
  submitMovement(row: InventoryItem, mode: MovementMode): void {
    this.submitting = true;
    this.api
      .createMovement({
        mode,
        buhin_cd: row.buhin_cd,
        souko_cd: row.souko_cd,
        su: this.quantityOf(row),
      })
      .subscribe({
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

  rowClass(row: InventoryItem, index: number): string {
    if (row.hantei === '欠品リスク') {
      return 'late';
    }
    if (row.hantei === '発注点割れ') {
      return 'warn';
    }
    return (index + 1) % 2 === 0 ? 'alt' : '';
  }

  format(value: string | number): string {
    return numberFormat(value);
  }

  private reload(): void {
    this.reloadItems();
    this.reloadWarehouses();
  }

  private reloadItems(): void {
    this.api.listItems({ souko: this.filterSouko }).subscribe({
      next: (result) => {
        this.items = result.rows;
        this.buhinKen = result.buhin_ken;
      },
      error: (error: HttpErrorResponse) => {
        // 取得失敗時に古い一覧を残して正しい最新データに見せない
        this.items = [];
        this.buhinKen = 0;
        this.showError(error);
      },
    });
  }

  private reloadWarehouses(): void {
    this.api.warehouseSummary().subscribe({
      next: (result) => {
        this.warehouses = result.rows;
        this.totalKingaku = result.total_kingaku;
      },
      error: (error: HttpErrorResponse) => {
        this.warehouses = [];
        this.totalKingaku = '0.00';
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
