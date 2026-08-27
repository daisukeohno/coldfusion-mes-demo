import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { InspectionApiService } from './inspection-api.service';
import { InspectionJudgment, InspectionRecord } from './inspection.types';

@Component({
  selector: 'app-inspection-history',
  imports: [CommonModule],
  templateUrl: './inspection-history.component.html',
  styleUrl: './inspection-history.component.css',
})
export class InspectionHistoryComponent implements OnInit {
  private readonly api = inject(InspectionApiService);
  records: InspectionRecord[] = [];
  filter: InspectionJudgment | '' = '';
  error = '';

  ngOnInit(): void {
    this.load();
  }

  setFilter(filter: InspectionJudgment | ''): void {
    this.filter = filter;
    this.load();
  }

  private load(): void {
    this.api.getInspections('', this.filter).subscribe({
      next: (records) => (this.records = records),
      error: () => (this.error = '検査履歴の取得に失敗しました。'),
    });
  }
}
