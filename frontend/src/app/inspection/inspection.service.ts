import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  DefectSummary,
  InspectionRequest,
  InspectionResponse,
  KensaResult,
  OrderForInspection,
} from './inspection.model';

/** 品質検査 REST API の HttpClient ラッパー。判定ロジックは持たない。 */
@Injectable({ providedIn: 'root' })
export class InspectionService {
  constructor(private readonly http: HttpClient) {}

  register(request: InspectionRequest): Observable<InspectionResponse> {
    return this.http.post<InspectionResponse>('/api/inspections', request);
  }

  /** 検査履歴。空の絞込条件はクエリに含めない (現行の絞込リンクと同じ挙動)。 */
  list(filter: { shijiNo?: string; hantei?: string } = {}): Observable<KensaResult[]> {
    let params = new HttpParams();
    if (filter.shijiNo) {
      params = params.set('shiji_no', filter.shijiNo);
    }
    if (filter.hantei) {
      params = params.set('hantei', filter.hantei);
    }
    return this.http.get<KensaResult[]>('/api/inspections', { params });
  }

  defectSummary(): Observable<DefectSummary[]> {
    return this.http.get<DefectSummary[]>('/api/inspections/defect-summary');
  }

  ordersForInspection(): Observable<OrderForInspection[]> {
    return this.http.get<OrderForInspection[]>('/api/orders/for-inspection');
  }
}
