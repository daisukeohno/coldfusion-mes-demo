import { Routes } from '@angular/router';
import { InspectionPageComponent } from './inspection/inspection-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inspection' },
  { path: 'inspection', component: InspectionPageComponent, title: '品質検査' },
];
