import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderDetail } from './order-detail.model';

@Injectable({ providedIn: 'root' })
export class OrderDetailApiService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  getOrderDetail(shijiNo: string): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(
      `${this.baseUrl}/order-detail/${encodeURIComponent(shijiNo)}`,
    );
  }
}
