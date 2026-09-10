import { Component } from '@angular/core';
import { InspectionComponent } from './inspection/inspection.component';

@Component({
  selector: 'app-root',
  imports: [InspectionComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
