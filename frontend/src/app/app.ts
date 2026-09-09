import { Component } from '@angular/core';
import { InspectionComponent } from './inspection/inspection.component';

@Component({
  imports: [InspectionComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
