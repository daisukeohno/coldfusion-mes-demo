import { Routes } from '@angular/router';

import { InspectionComponent } from './inspection/inspection.component';

export const routes: Routes = [
  { path: 'inspection', component: InspectionComponent, title: '品質検査' },
  { path: '', pathMatch: 'full', redirectTo: 'inspection' },
];
