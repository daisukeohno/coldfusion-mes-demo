import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateInspectionRequest,
  CreateInspectionResult,
  DefectSummary,
  Inspection,
  OrderOption,
} from './inspection.models';

@Injectable({ providedIn: 'root' })
export class InspectionApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  orders(): Observable<OrderOption[]> {
    return this.http.get<OrderOption[]>(`${this.base}/orders`);
  }

  list(filter: { shiji_no?: string; hantei?: string }): Observable<Inspection[]> {
    let params = new HttpParams();
    if (filter.shiji_no) params = params.set('shiji_no', filter.shiji_no);
    if (filter.hantei) params = params.set('hantei', filter.hantei);
    return this.http.get<Inspection[]>(`${this.base}/inspections`, { params });
  }

  defectSummary(): Observable<DefectSummary[]> {
    return this.http.get<DefectSummary[]>(`${this.base}/inspections/defect-summary`);
  }

  create(req: CreateInspectionRequest): Observable<CreateInspectionResult> {
    return this.http.post<CreateInspectionResult>(`${this.base}/inspections`, req);
  }
}
