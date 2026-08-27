import { Component } from '@angular/core';
import { DefectSummaryComponent } from './inspection/defect-summary.component';
import { InspectionHistoryComponent } from './inspection/inspection-history.component';
import { InspectionRegistrationComponent } from './inspection/inspection-registration.component';

@Component({
  imports: [
    InspectionRegistrationComponent,
    InspectionHistoryComponent,
    DefectSummaryComponent,
  ],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
