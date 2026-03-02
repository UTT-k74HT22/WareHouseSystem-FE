import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { PurchaseOrderResponse } from '../../dto/response/PurchaseOrder/PurchaseOrderResponse';
import {
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest
} from '../../dto/request/PurchaseOrder/PurchaseOrderRequest';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly apiUrl = `${BaseURL.API_URL}purchase-orders`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/purchase-orders */
  getAll(page = 0, size = 10): Observable<ApiResponse<PageResponse<PurchaseOrderResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<PurchaseOrderResponse>>>(this.apiUrl, { params });
  }

  /** GET /api/v1/purchase-orders/:id */
  getById(id: string): Observable<ApiResponse<PurchaseOrderResponse>> {
    return this.http.get<ApiResponse<PurchaseOrderResponse>>(`${this.apiUrl}/${id}`);
  }

  /** POST /api/v1/purchase-orders */
  create(request: CreatePurchaseOrderRequest): Observable<ApiResponse<PurchaseOrderResponse>> {
    return this.http.post<ApiResponse<PurchaseOrderResponse>>(this.apiUrl, request);
  }

  /** PUT /api/v1/purchase-orders/:id */
  update(id: string, request: UpdatePurchaseOrderRequest): Observable<ApiResponse<PurchaseOrderResponse>> {
    return this.http.put<ApiResponse<PurchaseOrderResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** DELETE /api/v1/purchase-orders/:id */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
