import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DefectSummary,
  InspectionCreatedResponse,
  InspectionFilter,
  InspectionRecord,
  InspectionRequest,
  ProductionOrderOption,
} from './inspection.models';

@Injectable({ providedIn: 'root' })
export class InspectionApiService {
  private readonly http = inject(HttpClient);

  register(request: InspectionRequest): Observable<InspectionCreatedResponse> {
    return this.http.post<InspectionCreatedResponse>('/api/inspections', request);
  }

  list(filter: InspectionFilter): Observable<InspectionRecord[]> {
    let params = new HttpParams();
    if (filter.shijiNo) {
      params = params.set('shiji_no', filter.shijiNo);
    }
    if (filter.hantei) {
      params = params.set('hantei', filter.hantei);
    }
    return this.http.get<InspectionRecord[]>('/api/inspections', { params });
  }

  defectSummary(): Observable<DefectSummary[]> {
    return this.http.get<DefectSummary[]>('/api/inspections/defect-summary');
  }

  productionOrders(): Observable<ProductionOrderOption[]> {
    return this.http.get<ProductionOrderOption[]>('/api/production-orders');
  }
}
