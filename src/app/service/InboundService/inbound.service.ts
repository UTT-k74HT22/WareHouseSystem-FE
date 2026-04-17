import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { InboundReceiptResponse } from '../../dto/response/InboundReceipt/InboundReceiptResponse';
import { InboundReceiptStatus } from '../../helper/enums/InboundReceiptStatus';
import {
  CreateInboundReceiptRequest,
  UpdateInboundReceiptRequest
} from '../../dto/request/InboundReceipt/InboundReceiptRequest';

export interface InboundReceiptFilters {
  receiptNumber?: string;
  purchaseOrderId?: string;
  warehouseId?: string;
  status?: InboundReceiptStatus;
  receiptDateFrom?: string;
  receiptDateTo?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'receiptNumber' | 'receiptDate' | 'status';
  direction?: 'ASC' | 'DESC';
}

@Injectable({ providedIn: 'root' })
export class InboundService {
  private readonly apiUrl = `${BaseURL.API_URL}inbound-receipts`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/inbound-receipts */
  getAll(
    page = 0,
    size = 10,
    filters?: InboundReceiptFilters
  ): Observable<ApiResponse<PageResponse<InboundReceiptResponse>>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filters) {
      if (filters.receiptNumber) {
        params = params.set('receipt_number', filters.receiptNumber);
      }
      if (filters.purchaseOrderId) {
        params = params.set('purchase_order_id', filters.purchaseOrderId);
      }
      if (filters.warehouseId) {
        params = params.set('warehouse_id', filters.warehouseId);
      }
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.receiptDateFrom) {
        params = params.set('receipt_date_from', filters.receiptDateFrom);
      }
      if (filters.receiptDateTo) {
        params = params.set('receipt_date_to', filters.receiptDateTo);
      }
      if (filters.sortBy) {
        params = params.set('sort_by', filters.sortBy);
      }
      if (filters.direction) {
        params = params.set('direction', filters.direction);
      }
    }

    return this.http.get<ApiResponse<PageResponse<InboundReceiptResponse>>>(this.apiUrl, { params });
  }

  /** GET /api/v1/inbound-receipts/:id */
  getById(id: string): Observable<ApiResponse<InboundReceiptResponse>> {
    return this.http.get<ApiResponse<InboundReceiptResponse>>(`${this.apiUrl}/${id}`);
  }

  /** GET /api/v1/inbound-receipts/by-po/:purchaseOrderId */
  getByPurchaseOrderId(purchaseOrderId: string): Observable<ApiResponse<InboundReceiptResponse[]>> {
    return this.http.get<ApiResponse<InboundReceiptResponse[]>>(`${this.apiUrl}/by-po/${purchaseOrderId}`);
  }

  /** POST /api/v1/inbound-receipts */
  create(request: CreateInboundReceiptRequest): Observable<ApiResponse<InboundReceiptResponse>> {
    return this.http.post<ApiResponse<InboundReceiptResponse>>(this.apiUrl, request);
  }

  /** PUT /api/v1/inbound-receipts/:id */
  update(id: string, request: UpdateInboundReceiptRequest): Observable<ApiResponse<InboundReceiptResponse>> {
    return this.http.put<ApiResponse<InboundReceiptResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** DELETE /api/v1/inbound-receipts/:id */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /** PUT /api/v1/inbound-receipts/:id/confirm */
  confirm(id: string): Observable<ApiResponse<InboundReceiptResponse>> {
    return this.http.put<ApiResponse<InboundReceiptResponse>>(`${this.apiUrl}/${id}/confirm`, {});
  }
}
