import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProgressApiService } from './progress-api.service';
import {
  CreateProgressRequest,
  ProgressRecord,
  ProgressShijiOrder,
  Setsubi,
} from './progress.model';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.css',
})
export class ProgressComponent implements OnInit {
  /** 初期値は app/progress.cfm のフォーム初期値と同じ */
  form: CreateProgressRequest = {
    shiji_no: '',
    kotei_no: '2',
    kotei_nm: '鋳造',
    setsubi_cd: '',
    sagyousha: '田中 一郎',
    yoryo_suryo: '10',
    furyo_suryo: '0',
    kanryo: '0',
  };

  shijiOrders: ProgressShijiOrder[] = [];
  setsubiList: Setsubi[] = [];
  koteiNames: string[] = [];
  records: ProgressRecord[] = [];

  message = '';
  /** true の場合はエラーメッセージ (CFML の "NG:" プレフィックス相当) */
  messageIsError = false;
  submitting = false;

  constructor(private readonly api: ProgressApiService) {}

  ngOnInit(): void {
    this.api.listShijiOrders().subscribe({
      next: (orders) => {
        this.shijiOrders = orders;
        if (!this.form.shiji_no && orders.length > 0) {
          this.form.shiji_no = orders[0].shiji_no;
        }
      },
      error: (error: HttpErrorResponse) => {
        this.shijiOrders = [];
        this.showError(error);
      },
    });
    this.api.listSetsubi().subscribe({
      next: (rows) => (this.setsubiList = rows),
      error: (error: HttpErrorResponse) => {
        this.setsubiList = [];
        this.showError(error);
      },
    });
    this.api.listKoteiNames().subscribe({
      next: (names) => {
        this.koteiNames = names;
        if (names.length > 0) {
          this.form.kotei_nm = names[0];
        }
      },
      error: (error: HttpErrorResponse) => {
        this.koteiNames = [];
        this.showError(error);
      },
    });
    this.reloadRecords();
  }

  /** 検証・数量加算はサーバ側で確定する。画面はレスポンスを表示するだけ */
  submit(): void {
    this.submitting = true;
    this.api.createRecord(this.form).subscribe({
      next: (result) => {
        this.submitting = false;
        this.message = result.message;
        this.messageIsError = false;
        // CFML 版は登録後に url.shiji_no で同じ指示が選択された状態で再描画される
        this.form.shiji_no = result.shiji_no;
        this.reloadRecords();
        this.reloadShijiOrders();
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.message = this.extractErrorMessage(error);
        this.messageIsError = true;
      },
    });
  }

  rowClass(index: number): string {
    return (index + 1) % 2 === 0 ? 'alt' : '';
  }

  /** CFML の dateFormat(...,"mm/dd") + timeFormat(...,"HH:mm") 相当 */
  formatDateTime(value: string | null): string {
    if (!value) {
      return '';
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value);
    if (!match) {
      return value;
    }
    const [, , month, day, hour, minute] = match;
    return `${month}/${day} ${hour}:${minute}`;
  }

  setsubiLabel(row: ProgressRecord): string {
    return `${row.setsubi_cd ?? ''} ${row.setsubi_nm ?? ''}`.trim();
  }

  private reloadRecords(): void {
    this.api.listRecords().subscribe({
      next: (rows) => (this.records = rows),
      error: (error: HttpErrorResponse) => {
        // 取得失敗時に古い一覧を残して最新データに見せない
        this.records = [];
        this.showError(error);
      },
    });
  }

  private reloadShijiOrders(): void {
    this.api.listShijiOrders().subscribe({
      next: (orders) => (this.shijiOrders = orders),
      error: (error: HttpErrorResponse) => {
        this.shijiOrders = [];
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
