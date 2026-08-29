import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DashboardComponent } from './dashboard/dashboard.component';
import { InspectionComponent } from './inspection/inspection.component';

type View = 'dashboard' | 'inspection';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent, InspectionComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly kojoName = '第二工場 (SEIZO-MES)';
  view: View = 'dashboard';
}
