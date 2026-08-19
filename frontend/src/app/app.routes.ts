import { Routes } from '@angular/router';
import { InspectionComponent } from './inspection/inspection.component';
import { OrderDetailComponent } from './order-detail/order-detail.component';

export const routes: Routes = [
  { path: '', component: InspectionComponent },
  { path: 'order-detail', component: OrderDetailComponent },
];
