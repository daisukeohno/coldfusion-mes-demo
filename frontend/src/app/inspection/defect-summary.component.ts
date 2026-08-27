import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { InspectionApiService } from './inspection-api.service';
import { DefectSummary } from './inspection.types';

@Component({
  selector: 'app-defect-summary',
  imports: [CommonModule],
  templateUrl: './defect-summary.component.html',
  styleUrl: './defect-summary.component.css',
})
export class DefectSummaryComponent implements OnInit {
  private readonly api = inject(InspectionApiService);
  summaries: DefectSummary[] = [];
  error = '';

  ngOnInit(): void {
    this.api.getDefectSummary().subscribe({
      next: (summaries) => (this.summaries = summaries),
      error: () => (this.error = '不良内容集計の取得に失敗しました。'),
    });
  }
}
