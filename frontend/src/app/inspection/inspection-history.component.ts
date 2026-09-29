import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InspectionRecord } from './inspection.models';
import { legacyOrderDetailUrl } from '../app.settings';

@Component({
  selector: 'app-inspection-history',
  imports: [RouterLink],
  templateUrl: './inspection-history.component.html',
})
export class InspectionHistoryComponent {
  readonly records = input.required<InspectionRecord[]>();

  readonly orderDetailUrl = legacyOrderDetailUrl;

  rowClass(record: InspectionRecord, index: number): string | null {
    if (record.hantei === 'NG') {
      return 'late';
    }
    if (record.hantei === '再検査') {
      return 'warn';
    }
    return (index + 1) % 2 === 0 ? 'alt' : null;
  }

  formatDecimal(value: number | null): string {
    return value === null ? '' : value.toFixed(3);
  }

  formatDate(value: string | null): string {
    return value === null ? '' : value.replaceAll('-', '/');
  }
}
