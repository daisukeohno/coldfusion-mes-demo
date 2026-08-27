import { Component, effect, inject, signal } from '@angular/core';
import { InspectionApiService } from './inspection-api.service';
import { InspectionRefreshService } from './inspection-refresh.service';
import { DefectSummary } from './inspection.types';

@Component({
  selector: 'app-defect-summary',
  imports: [],
  templateUrl: './defect-summary.component.html',
  styleUrl: './defect-summary.component.css',
})
export class DefectSummaryComponent {
  private readonly api = inject(InspectionApiService);
  private readonly refreshService = inject(InspectionRefreshService);
  readonly summaries = signal<DefectSummary[]>([]);
  readonly error = signal('');

  constructor() {
    effect(() => {
      this.refreshService.refreshed();
      this.load();
    });
  }

  private load(): void {
    this.api.getDefectSummary().subscribe({
      next: (summaries) => this.summaries.set(summaries),
      error: () => this.error.set('不良内容集計の取得に失敗しました。'),
    });
  }
}
