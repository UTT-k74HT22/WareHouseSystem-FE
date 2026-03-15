import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PurchaseOrderLineResponse } from '../../dto/response/PurchaseOrderLine/PurchaseOrderLineResponse';
import {
  CreatePurchaseOrderLineRequest,
  UpdatePurchaseOrderLineRequest
} from '../../dto/request/PurchaseOrderLine/PurchaseOrderLineRequest';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderLineService {
  private readonly apiUrl = `${BaseURL.API_URL}purchase-order-lines`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/purchase-order-lines?purchaseOrderId=:id */
  getByPurchaseOrderId(id: string): Observable<ApiResponse<PurchaseOrderLineResponse[]>> {
    return this.http.get<ApiResponse<PurchaseOrderLineResponse[]>>(
      `${this.apiUrl}/purchase-order/${id}`
    );
  }

  /** POST /api/v1/purchase-order-lines */
  create(request: CreatePurchaseOrderLineRequest): Observable<ApiResponse<PurchaseOrderLineResponse>> {
    return this.http.post<ApiResponse<PurchaseOrderLineResponse>>(this.apiUrl, request);
  }

  /** PUT /api/v1/purchase-order-lines/:id */
  update(id: string, request: UpdatePurchaseOrderLineRequest): Observable<ApiResponse<PurchaseOrderLineResponse>> {
    return this.http.put<ApiResponse<PurchaseOrderLineResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** DELETE /api/v1/purchase-order-lines/:id */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}

