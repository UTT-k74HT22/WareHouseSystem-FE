import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { InboundReceiptLineResponse } from '../../dto/response/InboundReceipt/InboundReceiptResponse';
import {
  CreateInboundReceiptLineRequest,
  UpdateInboundReceiptLineRequest
} from '../../dto/request/InboundReceiptLine/InboundReceiptLineRequest';

@Injectable({ providedIn: 'root' })
export class InboundReceiptLineService {
  private readonly apiUrl = `${BaseURL.API_URL}inbound-receipt-lines`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/inbound-receipt-lines?inboundReceiptId=:id */
  getByInboundReceiptId(inboundReceiptId: string): Observable<ApiResponse<InboundReceiptLineResponse[]>> {
    const params = new HttpParams().set('inboundReceiptId', inboundReceiptId);
    return this.http.get<ApiResponse<InboundReceiptLineResponse[]>>(this.apiUrl, { params });
  }

  /** POST /api/v1/inbound-receipt-lines */
  create(request: CreateInboundReceiptLineRequest): Observable<ApiResponse<InboundReceiptLineResponse>> {
    return this.http.post<ApiResponse<InboundReceiptLineResponse>>(this.apiUrl, request);
  }

  /** PUT /api/v1/inbound-receipt-lines/:id */
  update(id: string, request: UpdateInboundReceiptLineRequest): Observable<ApiResponse<InboundReceiptLineResponse>> {
    return this.http.put<ApiResponse<InboundReceiptLineResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** DELETE /api/v1/inbound-receipt-lines/:id */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
