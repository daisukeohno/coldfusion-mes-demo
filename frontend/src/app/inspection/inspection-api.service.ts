import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateInspectionRequest,
  CreateInspectionResponse,
  DefectSummary,
  Inspection,
  ShijiOrder,
} from './inspection.model';

@Injectable({ providedIn: 'root' })
export class InspectionApiService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  createInspection(body: CreateInspectionRequest): Observable<CreateInspectionResponse> {
    return this.http.post<CreateInspectionResponse>(`${this.baseUrl}/inspections`, body);
  }

  listInspections(filter: { shiji_no?: string; hantei?: string } = {}): Observable<Inspection[]> {
    let params = new HttpParams();
    if (filter.shiji_no) {
      params = params.set('shiji_no', filter.shiji_no);
    }
    if (filter.hantei) {
      params = params.set('hantei', filter.hantei);
    }
    return this.http.get<Inspection[]>(`${this.baseUrl}/inspections`, { params });
  }

  defectSummary(): Observable<DefectSummary[]> {
    return this.http.get<DefectSummary[]>(`${this.baseUrl}/inspections/defect-summary`);
  }

  listShijiOrders(): Observable<ShijiOrder[]> {
    return this.http.get<ShijiOrder[]>(`${this.baseUrl}/shiji-orders`);
  }
}
