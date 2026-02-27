import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { OutboundShipmentResponse } from '../../dto/response/OutboundShipment/OutboundShipmentResponse';
import {
  CreateOutboundShipmentRequest,
  UpdateOutboundShipmentRequest
} from '../../dto/request/OutboundShipment/OutboundShipmentRequest';

@Injectable({ providedIn: 'root' })
export class OutboundService {
  private readonly apiUrl = `${BaseURL.API_URL}outbound-shipments`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/outbound-shipments */
  getAll(page = 0, size = 10): Observable<ApiResponse<PageResponse<OutboundShipmentResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<OutboundShipmentResponse>>>(this.apiUrl, { params });
  }

  /** GET /api/v1/outbound-shipments/:id */
  getById(id: string): Observable<ApiResponse<OutboundShipmentResponse>> {
    return this.http.get<ApiResponse<OutboundShipmentResponse>>(`${this.apiUrl}/${id}`);
  }

  /** POST /api/v1/outbound-shipments */
  create(request: CreateOutboundShipmentRequest): Observable<ApiResponse<OutboundShipmentResponse>> {
    return this.http.post<ApiResponse<OutboundShipmentResponse>>(this.apiUrl, request);
  }

  /** PUT /api/v1/outbound-shipments/:id */
  update(id: string, request: UpdateOutboundShipmentRequest): Observable<ApiResponse<OutboundShipmentResponse>> {
    return this.http.put<ApiResponse<OutboundShipmentResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** DELETE /api/v1/outbound-shipments/:id */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
