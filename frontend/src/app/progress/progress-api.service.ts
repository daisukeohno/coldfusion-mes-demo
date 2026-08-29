import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateProgressRequest,
  CreateProgressResponse,
  ProgressRecord,
  ProgressShijiOrder,
  Setsubi,
} from './progress.model';

@Injectable({ providedIn: 'root' })
export class ProgressApiService {
  private readonly baseUrl = '/api/progress';

  constructor(private readonly http: HttpClient) {}

  createRecord(body: CreateProgressRequest): Observable<CreateProgressResponse> {
    return this.http.post<CreateProgressResponse>(`${this.baseUrl}/records`, body);
  }

  listRecords(): Observable<ProgressRecord[]> {
    return this.http.get<ProgressRecord[]>(`${this.baseUrl}/records`);
  }

  listShijiOrders(): Observable<ProgressShijiOrder[]> {
    return this.http.get<ProgressShijiOrder[]>(`${this.baseUrl}/shiji-orders`);
  }

  listSetsubi(): Observable<Setsubi[]> {
    return this.http.get<Setsubi[]>(`${this.baseUrl}/setsubi`);
  }

  listKoteiNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/kotei-names`);
  }
}
