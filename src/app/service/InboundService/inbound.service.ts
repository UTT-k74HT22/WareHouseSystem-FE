import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { InboundReceiptResponse } from '../../dto/response/InboundReceipt/InboundReceiptResponse';
import {
  CreateInboundReceiptRequest,
  UpdateInboundReceiptRequest
} from '../../dto/request/InboundReceipt/InboundReceiptRequest';

@Injectable({ providedIn: 'root' })
export class InboundService {
  private readonly apiUrl = `${BaseURL.API_URL}inbound-receipts`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/inbound-receipts */
  getAll(page = 0, size = 10): Observable<ApiResponse<PageResponse<InboundReceiptResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<InboundReceiptResponse>>>(this.apiUrl, { params });
  }

  /** GET /api/v1/inbound-receipts/:id */
  getById(id: string): Observable<ApiResponse<InboundReceiptResponse>> {
    return this.http.get<ApiResponse<InboundReceiptResponse>>(`${this.apiUrl}/${id}`);
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
}
