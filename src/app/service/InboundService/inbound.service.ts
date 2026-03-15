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
      params = this.setParamWithAliases(params, 'receiptNumber', filters.receiptNumber, ['receipt_number']);
      params = this.setParamWithAliases(params, 'purchaseOrderId', filters.purchaseOrderId, ['purchase_order_id']);
      params = this.setParamWithAliases(params, 'warehouseId', filters.warehouseId, ['warehouse_id']);
      params = this.setParamWithAliases(params, 'status', filters.status);
      params = this.setParamWithAliases(params, 'receiptDateFrom', filters.receiptDateFrom, ['receipt_date_from']);
      params = this.setParamWithAliases(params, 'receiptDateTo', filters.receiptDateTo, ['receipt_date_to']);
      params = this.setParamWithAliases(params, 'sortBy', filters.sortBy);
      params = this.setParamWithAliases(params, 'direction', filters.direction);
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

  private setParamWithAliases(
    params: HttpParams,
    key: string,
    value?: string | number | boolean | null,
    aliases: string[] = []
  ): HttpParams {
    if (value === undefined || value === null || value === '') {
      return params;
    }

    const normalizedValue = String(value);
    let nextParams = params.set(key, normalizedValue);

    for (const alias of aliases) {
      nextParams = nextParams.set(alias, normalizedValue);
    }

    return nextParams;
  }
}
