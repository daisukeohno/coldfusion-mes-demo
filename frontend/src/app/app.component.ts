import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { InspectionComponent } from './inspection/inspection.component';
import { ReportComponent } from './report/report.component';

export type Page = 'inspection' | 'report';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, InspectionComponent, ReportComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly kojoName = '第二工場 (SEIZO-MES)';
  page: Page = location.hash === '#report' ? 'report' : 'inspection';

  setPage(page: Page): void {
    this.page = page;
    location.hash = page === 'report' ? '#report' : '';
  }
}
