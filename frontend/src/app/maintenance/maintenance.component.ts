import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaintenanceApiService } from './maintenance-api.service';
import {
  CreateMaintenanceRequest,
  DowntimeSummary,
  EquipmentPlan,
  MaintenanceRecord,
} from './maintenance.model';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.css',
})
export class MaintenanceComponent implements OnInit {
  /** app/maintenance.cfm の種別ドロップダウンと同じ選択肢・同じ順序 */
  readonly shubetsuList = ['定期点検', '故障修理', '部品交換'];

  form: CreateMaintenanceRequest = {
    setsubi_cd: '',
    shubetsu: '定期点検',
    teishi_jikan: '0.0',
    fukyu: '0',
    naiyo: '',
    tantou: '保全 大野',
  };

  equipmentPlans: EquipmentPlan[] = [];
  records: MaintenanceRecord[] = [];
  downtimeSummary: DowntimeSummary[] = [];

  message = '';
  messageIsError = false;
  submitting = false;

  constructor(private readonly api: MaintenanceApiService) {}

  ngOnInit(): void {
    this.reload();
  }

  /** 発生日・復旧日・点検判定はすべてサーバ側で確定する */
  submit(): void {
    this.submitting = true;
    this.api.createMaintenance(this.form).subscribe({
      next: (result) => {
        this.submitting = false;
        this.message = result.message;
        this.messageIsError = false;
        // CFML 版はフォームが固定初期値で再描画される
        this.form.teishi_jikan = '0.0';
        this.form.naiyo = '';
        this.form.fukyu = '0';
        this.reload();
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.showError(error);
      },
    });
  }

  /** 期限超過は行全体を late、それ以外は偶数行を alt (CFML と同じ) */
  planRowClass(row: EquipmentPlan, index: number): string {
    if (row.okure) {
      return 'late';
    }
    return (index + 1) % 2 === 0 ? 'alt' : '';
  }

  /** 未復旧 (復旧日なし) は warn、それ以外は偶数行を alt */
  recordRowClass(row: MaintenanceRecord, index: number): string {
    if (!row.fukyu_ymd) {
      return 'warn';
    }
    return (index + 1) % 2 === 0 ? 'alt' : '';
  }

  formatDate(value: string | null): string {
    return value ? value.slice(0, 10).replace(/-/g, '/') : '';
  }

  /** CFML の numberFormat(x,"9.9") と同じ小数1桁表示 */
  formatJikan(value: string): string {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(1) : value;
  }

  private reload(): void {
    this.api.listEquipmentPlans().subscribe({
      next: (rows) => {
        this.equipmentPlans = rows;
        // 設備ドロップダウンは CFML と同じ ライン→設備コード 順の先頭を初期選択にする
        if (!this.form.setsubi_cd && rows.length > 0) {
          this.form.setsubi_cd = rows[0].setsubi_cd;
        }
      },
      error: (error: HttpErrorResponse) => {
        // 取得失敗時に古い行を残して最新データに見せない
        this.equipmentPlans = [];
        this.showError(error);
      },
    });
    this.api.listMaintenances().subscribe({
      next: (rows) => (this.records = rows),
      error: (error: HttpErrorResponse) => {
        this.records = [];
        this.showError(error);
      },
    });
    this.api.downtimeSummary().subscribe({
      next: (rows) => (this.downtimeSummary = rows),
      error: (error: HttpErrorResponse) => {
        this.downtimeSummary = [];
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
