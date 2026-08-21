import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  DefectSummary,
  InspectionRecord,
  InspectionRequest,
  InspectionResponse,
  OrderOption
} from './inspection.model';

/**
 * 検査 API クライアント。
 * 判定ロジックはバックエンドの InspectionJudgmentService に集約されているため、
 * フロント側では一切判定を行わずサーバの判定結果のみを表示する。
 */
@Injectable({ providedIn: 'root' })
export class InspectionService {
  constructor(private readonly http: HttpClient) {}

  getInspections(shijiNo = '', hantei = ''): Observable<InspectionRecord[]> {
    let params = new HttpParams();
    if (shijiNo) {
      params = params.set('shiji_no', shijiNo);
    }
    if (hantei) {
      params = params.set('hantei', hantei);
    }
    return this.http.get<InspectionRecord[]>('/api/inspections', { params });
  }

  getDefectSummary(): Observable<DefectSummary[]> {
    return this.http.get<DefectSummary[]>('/api/inspections/defect-summary');
  }

  getOrdersForInspection(): Observable<OrderOption[]> {
    return this.http.get<OrderOption[]>('/api/orders/for-inspection');
  }

  register(request: InspectionRequest): Observable<InspectionResponse> {
    return this.http.post<InspectionResponse>('/api/inspections', request);
  }
}
