import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DefectSummary,
  Hantei,
  InspectionRecord,
  InspectionRequest,
  OrderOption,
} from './inspection.model';

@Injectable({ providedIn: 'root' })
export class InspectionApiService {
  private readonly base = '/api';

  constructor(private readonly http: HttpClient) {}

  listOrders(): Observable<OrderOption[]> {
    return this.http.get<OrderOption[]>(`${this.base}/orders`);
  }

  listInspections(filter: { shiji_no?: string; hantei?: Hantei | '' }): Observable<InspectionRecord[]> {
    let params = new HttpParams();
    if (filter.shiji_no) {
      params = params.set('shiji_no', filter.shiji_no);
    }
    if (filter.hantei) {
      params = params.set('hantei', filter.hantei);
    }
    return this.http.get<InspectionRecord[]>(`${this.base}/inspections`, { params });
  }

  register(req: InspectionRequest): Observable<InspectionRecord> {
    return this.http.post<InspectionRecord>(`${this.base}/inspections`, req);
  }

  defectSummary(): Observable<DefectSummary[]> {
    return this.http.get<DefectSummary[]>(`${this.base}/inspections/defect-summary`);
  }
}
