import { Routes } from '@angular/router';
import { InspectionComponent } from './inspection/inspection.component';
import { OrdersComponent } from './orders/orders.component';

export const routes: Routes = [
  { path: '', component: InspectionComponent },
  { path: 'orders', component: OrdersComponent },
];
