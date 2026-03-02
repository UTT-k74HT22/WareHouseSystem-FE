import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { SalesOrderResponse } from '../../dto/response/SalesOrder/SalesOrderResponse';
import {
  CreateSalesOrderRequest,
  UpdateSalesOrderRequest
} from '../../dto/request/SalesOrder/SalesOrderRequest';

@Injectable({ providedIn: 'root' })
export class SalesOrderService {
  private readonly apiUrl = `${BaseURL.API_URL}sales-orders`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/sales-orders */
  getAll(page = 0, size = 10): Observable<ApiResponse<PageResponse<SalesOrderResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<SalesOrderResponse>>>(this.apiUrl, { params });
  }

  /** GET /api/v1/sales-orders/:id */
  getById(id: string): Observable<ApiResponse<SalesOrderResponse>> {
    return this.http.get<ApiResponse<SalesOrderResponse>>(`${this.apiUrl}/${id}`);
  }

  /** POST /api/v1/sales-orders */
  create(request: CreateSalesOrderRequest): Observable<ApiResponse<SalesOrderResponse>> {
    return this.http.post<ApiResponse<SalesOrderResponse>>(this.apiUrl, request);
  }

  /** PUT /api/v1/sales-orders/:id */
  update(id: string, request: UpdateSalesOrderRequest): Observable<ApiResponse<SalesOrderResponse>> {
    return this.http.put<ApiResponse<SalesOrderResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** DELETE /api/v1/sales-orders/:id */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
