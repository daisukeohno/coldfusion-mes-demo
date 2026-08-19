import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateMaintenanceRequest,
  CreateMaintenanceResponse,
  DowntimeSummary,
  EquipmentPlan,
  MaintenanceRecord,
} from './maintenance.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceApiService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  createMaintenance(body: CreateMaintenanceRequest): Observable<CreateMaintenanceResponse> {
    return this.http.post<CreateMaintenanceResponse>(`${this.baseUrl}/maintenances`, body);
  }

  listMaintenances(): Observable<MaintenanceRecord[]> {
    return this.http.get<MaintenanceRecord[]>(`${this.baseUrl}/maintenances`);
  }

  downtimeSummary(): Observable<DowntimeSummary[]> {
    return this.http.get<DowntimeSummary[]>(`${this.baseUrl}/maintenances/downtime-summary`);
  }

  listEquipmentPlans(): Observable<EquipmentPlan[]> {
    return this.http.get<EquipmentPlan[]>(`${this.baseUrl}/equipment-plans`);
  }
}
