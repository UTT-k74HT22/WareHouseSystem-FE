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
      params = this.setParam(params, 'receiptNumber', filters.receiptNumber);
      params = this.setParam(params, 'purchaseOrderId', filters.purchaseOrderId);
      params = this.setParam(params, 'warehouseId', filters.warehouseId);
      params = this.setParam(params, 'status', filters.status);
      params = this.setParam(params, 'receiptDateFrom', filters.receiptDateFrom);
      params = this.setParam(params, 'receiptDateTo', filters.receiptDateTo);
      params = this.setParam(params, 'sortBy', filters.sortBy);
      params = this.setParam(params, 'direction', filters.direction);
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

  /** PUT /api/v1/inbound-receipts/:id/cancel */
  cancel(id: string): Observable<ApiResponse<InboundReceiptResponse>> {
    return this.http.put<ApiResponse<InboundReceiptResponse>>(`${this.apiUrl}/${id}/cancel`, {});
  }

  /** GET /api/v1/inbound-receipts/stats */
  getStats(): Observable<ApiResponse<Record<string, number>>> {
    return this.http.get<ApiResponse<Record<string, number>>>(`${this.apiUrl}/stats`);
  }

  private setParam(
    params: HttpParams,
    key: string,
    value?: string | number | boolean | null
  ): HttpParams {
    if (value === undefined || value === null || value === '') {
      return params;
    }

    return params.set(key, String(value));
  }
}
