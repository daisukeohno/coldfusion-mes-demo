import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InspectionComponent } from './inspection/inspection.component';
import { InventoryComponent } from './inventory/inventory.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, InspectionComponent, InventoryComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly kojoName = '第二工場 (SEIZO-MES)';

  view: 'inspection' | 'inventory' =
    typeof location !== 'undefined' && location.hash === '#inventory' ? 'inventory' : 'inspection';

  show(view: 'inspection' | 'inventory'): void {
    this.view = view;
    location.hash = view;
  }
}
