import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderFilter, OrderListResponse, OrderSearchOptions } from './orders.model';

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  listOrders(filter: Partial<OrderFilter> = {}): Observable<OrderListResponse> {
    let params = new HttpParams();
    if (filter.kw) {
      params = params.set('kw', filter.kw);
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.line) {
      params = params.set('line', filter.line);
    }
    if (filter.sort) {
      params = params.set('sort', filter.sort);
    }
    return this.http.get<OrderListResponse>(`${this.baseUrl}/orders`, { params });
  }

  searchOptions(): Observable<OrderSearchOptions> {
    return this.http.get<OrderSearchOptions>(`${this.baseUrl}/orders/search-options`);
  }
}
