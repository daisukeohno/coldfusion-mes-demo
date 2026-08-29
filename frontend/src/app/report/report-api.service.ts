import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DailyReport } from './report.model';

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  dailyReport(ymd?: string): Observable<DailyReport> {
    let params = new HttpParams();
    if (ymd) {
      params = params.set('ymd', ymd);
    }
    return this.http.get<DailyReport>(`${this.baseUrl}/report/daily`, { params });
  }
}
