import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CreateInspection,
  DefectSummary,
  InspectionJudgment,
  InspectionRecord,
  ProductionOrder,
} from './inspection.types';

@Injectable({ providedIn: 'root' })
export class InspectionApiService {
  private readonly http = inject(HttpClient);

  getProductionOrders() {
    return this.http.get<ProductionOrder[]>('/api/production-orders');
  }

  getInspections(shijiNo = '', judgment: InspectionJudgment | '' = '') {
    let params = new HttpParams();
    if (shijiNo) params = params.set('shiji_no', shijiNo);
    if (judgment) params = params.set('hantei', judgment);
    return this.http.get<InspectionRecord[]>('/api/inspections', { params });
  }

  createInspection(inspection: CreateInspection) {
    return this.http.post<InspectionRecord>('/api/inspections', inspection);
  }

  getDefectSummary() {
    return this.http.get<DefectSummary[]>('/api/inspections/defect-summary');
  }
}
