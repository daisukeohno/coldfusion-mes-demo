import { Component } from '@angular/core';

import { InspectionComponent } from './inspection/inspection.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [InspectionComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {}
