import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DashboardApiService } from './dashboard-api.service';
import { Dashboard } from './dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  /** 集計結果はすべて API のレスポンスをそのまま表示する (画面側で再計算しない) */
  dashboard: Dashboard | null = null;
  message = '';

  constructor(private readonly api: DashboardApiService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.message = '';
      },
      error: (error: HttpErrorResponse) => {
        // 取得失敗時に古い集計を残して最新データに見せない
        this.dashboard = null;
        this.message = this.extractErrorMessage(error);
      },
    });
  }

  /** yyyy-mm-dd -> yyyy年mm月dd日 */
  formatJapaneseDate(value: string): string {
    const parts = value?.split('-') ?? [];
    return parts.length === 3 ? `${parts[0]}年${parts[1]}月${parts[2]}日` : value;
  }

  /** yyyy-mm-dd -> yyyy/mm/dd */
  formatDate(value: string): string {
    return value ? value.slice(0, 10).replace(/-/g, '/') : '';
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
