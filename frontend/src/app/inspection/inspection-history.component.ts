import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { InspectionApiService } from './inspection-api.service';
import { InspectionRefreshService } from './inspection-refresh.service';
import { InspectionJudgment, InspectionRecord } from './inspection.types';

@Component({
  selector: 'app-inspection-history',
  imports: [DatePipe],
  templateUrl: './inspection-history.component.html',
  styleUrl: './inspection-history.component.css',
})
export class InspectionHistoryComponent {
  private readonly api = inject(InspectionApiService);
  private readonly refreshService = inject(InspectionRefreshService);
  readonly records = signal<InspectionRecord[]>([]);
  readonly filter = signal<InspectionJudgment | ''>('');
  readonly error = signal('');

  constructor() {
    effect(() => {
      this.refreshService.refreshed();
      this.load();
    });
  }

  setFilter(filter: InspectionJudgment | ''): void {
    this.filter.set(filter);
  }

  private load(): void {
    this.api.getInspections('', this.filter()).subscribe({
      next: (records) => this.records.set(records),
      error: () => this.error.set('検査履歴の取得に失敗しました。'),
    });
  }
}
