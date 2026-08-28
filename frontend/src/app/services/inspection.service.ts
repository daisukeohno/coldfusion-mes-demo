import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type InspectionJudgment = 'OK' | 'NG' | '再検査';

export interface OrderOption {
  shiji_no: string;
  hinmoku_nm: string;
}

export interface CreateInspectionRequest {
  shiji_no: string;
  lot_no: string;
  kensa_sha: string;
  sunpou: string;
  kijun_min: string;
  kijun_max: string;
  furyo_naiyo: string;
}

export interface CreateInspectionResponse {
  kensa_id: number;
  hantei: InspectionJudgment;
  message: string;
}

export interface InspectionRecord {
  kensa_id: number;
  shiji_no: string;
  hinmoku_nm: string;
  line_cd: string | null;
  lot_no: string | null;
  kensa_ymd: string | null;
  kensa_sha: string | null;
  sunpou: string | null;
  kijun_min: string | null;
  kijun_max: string | null;
  hantei: InspectionJudgment;
  furyo_naiyo: string | null;
}

export interface DefectSummary {
  furyo_naiyo: string;
  ken: number;
}

export interface InspectionFilters {
  shiji_no?: string;
  hantei?: InspectionJudgment;
}

@Injectable({ providedIn: 'root' })
export class InspectionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getOrders(): Observable<OrderOption[]> {
    return this.http.get<OrderOption[]>(`${this.baseUrl}/orders`);
  }

  createInspection(
    request: CreateInspectionRequest,
  ): Observable<CreateInspectionResponse> {
    return this.http.post<CreateInspectionResponse>(
      `${this.baseUrl}/inspections`,
      request,
    );
  }

  getInspections(
    filters: InspectionFilters = {},
  ): Observable<InspectionRecord[]> {
    let params = new HttpParams();

    if (filters.shiji_no) {
      params = params.set('shiji_no', filters.shiji_no);
    }
    if (filters.hantei) {
      params = params.set('hantei', filters.hantei);
    }

    return this.http.get<InspectionRecord[]>(
      `${this.baseUrl}/inspections`,
      { params },
    );
  }

  getDefectSummary(): Observable<DefectSummary[]> {
    return this.http.get<DefectSummary[]>(
      `${this.baseUrl}/inspections/defect-summary`,
    );
  }
}
