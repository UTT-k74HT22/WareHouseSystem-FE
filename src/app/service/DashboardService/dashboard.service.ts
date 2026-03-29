import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { DashboardResponse } from '../../dto/response/Dashboard/DashboardResponse';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = `${BaseURL.API_URL}dashboard`;

  constructor(private http: HttpClient) {}

  getSnapshot(days = 7, activityLimit = 5, jobLimit = 5, warehouseId?: string): Observable<ApiResponse<DashboardResponse>> {
    let params = new HttpParams()
      .set('days', days)
      .set('activityLimit', activityLimit)
      .set('jobLimit', jobLimit);

    if (warehouseId) {
      params = params.set('warehouseId', warehouseId);
    }

    return this.http.get<ApiResponse<DashboardResponse>>(this.apiUrl, { params });
  }
}
