import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class InspectionRefreshService {
  private readonly refreshVersion = signal(0);
  readonly refreshed = this.refreshVersion.asReadonly();

  notify(): void {
    this.refreshVersion.update((version) => version + 1);
  }
}
