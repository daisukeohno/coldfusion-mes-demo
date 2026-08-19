import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { InspectionComponent } from './inspection/inspection.component';
import { OrdersComponent } from './orders/orders.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, InspectionComponent, OrdersComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly kojoName = '第二工場 (SEIZO-MES)';
  screen: 'inspection' | 'orders' = 'inspection';
}
