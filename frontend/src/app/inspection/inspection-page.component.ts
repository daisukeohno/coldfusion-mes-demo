import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { DefectSummaryComponent } from './defect-summary.component';
import { InspectionApiService } from './inspection-api.service';
import { InspectionFormComponent } from './inspection-form.component';
import { InspectionHistoryComponent } from './inspection-history.component';

@Component({
  selector: 'app-inspection-page',
  imports: [InspectionFormComponent, InspectionHistoryComponent, DefectSummaryComponent],
  templateUrl: './inspection-page.component.html',
})
export class InspectionPageComponent {
  private readonly api = inject(InspectionApiService);
  private readonly router = inject(Router);

  /** クエリパラメータ ?shiji_no= / ?hantei= (旧 url.shiji_no / url.hantei) */
  readonly shiji_no = input<string | undefined>();
  readonly hantei = input<string | undefined>();

  private readonly reloadToken = signal(0);

  readonly filter = computed(() => ({
    shijiNo: this.shiji_no() ?? '',
    hantei: this.hantei() ?? '',
    reload: this.reloadToken(),
  }));

  readonly productionOrders = rxResource({
    stream: () => this.api.productionOrders(),
  });

  readonly records = rxResource({
    params: () => this.filter(),
    stream: ({ params }) => this.api.list(params),
  });

  readonly defectSummary = rxResource({
    params: () => this.reloadToken(),
    stream: () => this.api.defectSummary(),
  });

  onRegistered(): void {
    this.reloadToken.update((n) => n + 1);
    void this.router.navigate(['/inspection']);
  }
}
