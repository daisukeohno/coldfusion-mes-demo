import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InspectionComponent } from './inspection/inspection.component';
import { ProgressComponent } from './progress/progress.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, InspectionComponent, ProgressComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly kojoName = '第二工場 (SEIZO-MES)';

  screen: 'inspection' | 'progress' = 'inspection';
}
