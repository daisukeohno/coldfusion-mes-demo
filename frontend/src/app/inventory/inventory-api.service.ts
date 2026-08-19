import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateMovementRequest,
  CreateMovementResponse,
  InventoryList,
  WarehouseSummaryList,
} from './inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  listItems(filter: { souko?: string } = {}): Observable<InventoryList> {
    let params = new HttpParams();
    if (filter.souko) {
      params = params.set('souko', filter.souko);
    }
    return this.http.get<InventoryList>(`${this.baseUrl}/inventory/items`, { params });
  }

  warehouseSummary(): Observable<WarehouseSummaryList> {
    return this.http.get<WarehouseSummaryList>(`${this.baseUrl}/inventory/warehouses`);
  }

  createMovement(body: CreateMovementRequest): Observable<CreateMovementResponse> {
    return this.http.post<CreateMovementResponse>(`${this.baseUrl}/inventory/movements`, body);
  }
}
