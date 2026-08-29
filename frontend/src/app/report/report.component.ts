import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportApiService } from './report-api.service';
import { DailyReport } from './report.model';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css',
})
export class ReportComponent implements OnInit {
  /** 承認欄の記入枠 (全角空白 4 個)。テンプレート直書きでは空白圧縮で潰れるため定数で持つ */
  readonly approvalLine =
    '承認欄:\u00a0 製造課長 [\u3000\u3000\u3000\u3000] \u00a0 品質保証課長 [\u3000\u3000\u3000\u3000] \u00a0 工場長 [\u3000\u3000\u3000\u3000]';

  /** 対象日。report.cfm と同じく集計の絞込には使われない */
  ymd = '';
  report: DailyReport | null = null;
  message = '';
  loading = false;

  constructor(private readonly api: ReportApiService) {}

  ngOnInit(): void {
    this.load();
  }

  /** 集計・判定はサーバ側で確定する。画面はレスポンスを表示するだけ */
  load(): void {
    this.loading = true;
    this.api.dailyReport(this.ymd).subscribe({
      next: (report) => {
        this.loading = false;
        this.report = report;
        this.ymd = report.ymd;
        this.message = '';
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        // 取得失敗時は古い集計を残さず、エラーだけを表示する
        this.report = null;
        this.message = this.extractErrorMessage(error);
      },
    });
  }

  print(): void {
    window.print();
  }

  /** 出力日 (yyyy年mm月dd日) */
  formatJpDate(value: string): string {
    const [y, m, d] = value.split('-');
    return y && m && d ? `${y}年${m}月${d}日` : value;
  }

  /** 納期 (yyyy/mm/dd) */
  formatDate(value: string): string {
    return value ? value.slice(0, 10).replace(/-/g, '/') : '';
  }

  altClass(index: number): string {
    return (index + 1) % 2 === 0 ? 'alt' : '';
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
