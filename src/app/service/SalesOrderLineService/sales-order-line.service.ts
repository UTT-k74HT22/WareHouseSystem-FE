import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { SalesOrderLinesResponse } from '../../dto/response/SalesOrderLine/SalesOrderLineResponse';
import {
  CreateSalesOrderLineRequest,
  UpdateSalesOrderLineRequest
} from '../../dto/request/SalesOrderLine/SalesOrderLineRequest';

@Injectable({ providedIn: 'root' })
export class SalesOrderLineService {
  private readonly apiUrl = `${BaseURL.API_URL}sales-order-lines`;

  constructor(private http: HttpClient) {}

  /** POST /api/v1/sales-order-lines */
  create(request: CreateSalesOrderLineRequest): Observable<ApiResponse<SalesOrderLinesResponse>> {
    return this.http.post<ApiResponse<SalesOrderLinesResponse>>(this.apiUrl, request);
  }

  /** PUT /api/v1/sales-order-lines/:id */
  update(id: string, request: UpdateSalesOrderLineRequest): Observable<ApiResponse<SalesOrderLinesResponse>> {
    return this.http.put<ApiResponse<SalesOrderLinesResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** GET /api/v1/sales-order-lines/by-so/:soId */
  getBySalesOrder(soId: string): Observable<ApiResponse<SalesOrderLinesResponse[]>> {
    return this.http.get<ApiResponse<SalesOrderLinesResponse[]>>(`${this.apiUrl}/by-so/${soId}`);
  }
}
