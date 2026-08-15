import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DefectSummary,
  InspectionRequest,
  InspectionResponse,
  KensaResult,
  SimpleOrder
} from './inspection.model';
import { API_BASE_URL } from '../api.config';

/** 品質検査 REST API の HttpClient ラッパー。 */
@Injectable({ providedIn: 'root' })
export class InspectionService {
  constructor(private readonly http: HttpClient) {}

  register(request: InspectionRequest): Observable<InspectionResponse> {
    return this.http.post<InspectionResponse>(`${API_BASE_URL}/inspections`, request);
  }

  search(shijiNo: string, hantei: string): Observable<KensaResult[]> {
    let params = new HttpParams();
    if (shijiNo) {
      params = params.set('shijiNo', shijiNo);
    }
    if (hantei) {
      params = params.set('hantei', hantei);
    }
    return this.http.get<KensaResult[]>(`${API_BASE_URL}/inspections`, { params });
  }

  defectSummary(): Observable<DefectSummary[]> {
    return this.http.get<DefectSummary[]>(`${API_BASE_URL}/inspections/defect-summary`);
  }

  simpleOrders(): Observable<SimpleOrder[]> {
    return this.http.get<SimpleOrder[]>(`${API_BASE_URL}/orders/simple`);
  }
}
