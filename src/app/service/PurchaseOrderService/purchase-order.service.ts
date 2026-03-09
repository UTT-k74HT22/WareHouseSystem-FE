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
import { OrderStatus } from '../../helper/enums/OrderStatus';

export interface PurchaseOrderFilters {
  purchaseOrderNumber?: string;
  supplierId?: string;
  warehouseId?: string;
  status?: OrderStatus;
  orderDateFrom?: string;
  orderDateTo?: string;
  expectedDeliveryDateFrom?: string;
  expectedDeliveryDateTo?: string;
  sortBy?: string;
  direction?: 'ASC' | 'DESC';
}

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly apiUrl = `${BaseURL.API_URL}purchase-orders`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/purchase-orders */
  getAll(
    page = 0,
    size = 10,
    filters?: PurchaseOrderFilters
  ): Observable<ApiResponse<PageResponse<PurchaseOrderResponse>>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (filters) {
      if (filters.purchaseOrderNumber) params = params.set('purchaseOrderNumber', filters.purchaseOrderNumber);
      if (filters.supplierId) params = params.set('supplierId', filters.supplierId);
      if (filters.warehouseId) params = params.set('warehouseId', filters.warehouseId);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.orderDateFrom) params = params.set('orderDateFrom', filters.orderDateFrom);
      if (filters.orderDateTo) params = params.set('orderDateTo', filters.orderDateTo);
      if (filters.expectedDeliveryDateFrom) {
        params = params.set('expectedDeliveryDateFrom', filters.expectedDeliveryDateFrom);
      }
      if (filters.expectedDeliveryDateTo) {
        params = params.set('expectedDeliveryDateTo', filters.expectedDeliveryDateTo);
      }
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.direction) params = params.set('direction', filters.direction);
    }

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

  /** PUT /api/v1/purchase-orders/:id/confirm */
  confirm(id: string): Observable<ApiResponse<PurchaseOrderResponse>> {
    return this.http.put<ApiResponse<PurchaseOrderResponse>>(`${this.apiUrl}/${id}/confirm`, {});
  }
}
