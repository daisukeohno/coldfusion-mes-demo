import { Component, input } from '@angular/core';
import { DefectSummary } from './inspection.models';

@Component({
  selector: 'app-defect-summary',
  templateUrl: './defect-summary.component.html',
})
export class DefectSummaryComponent {
  readonly summary = input.required<DefectSummary[]>();
}
