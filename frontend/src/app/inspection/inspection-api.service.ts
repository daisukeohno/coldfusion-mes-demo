import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateInspectionRequest,
  CreateInspectionResponse,
  DefectSummary,
  Inspection,
  InspectionFilter,
  ShijiOption,
} from './inspection.models';

@Injectable({ providedIn: 'root' })
export class InspectionApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  listShiji(): Observable<ShijiOption[]> {
    return this.http.get<ShijiOption[]>(`${this.base}/shiji`);
  }

  listInspections(filter: InspectionFilter): Observable<Inspection[]> {
    let params = new HttpParams();
    if (filter.shiji_no) params = params.set('shiji_no', filter.shiji_no);
    if (filter.hantei) params = params.set('hantei', filter.hantei);
    return this.http.get<Inspection[]>(`${this.base}/inspections`, { params });
  }

  defectSummary(): Observable<DefectSummary[]> {
    return this.http.get<DefectSummary[]>(`${this.base}/inspections/defect-summary`);
  }

  register(req: CreateInspectionRequest): Observable<CreateInspectionResponse> {
    return this.http.post<CreateInspectionResponse>(`${this.base}/inspections`, req);
  }
}
