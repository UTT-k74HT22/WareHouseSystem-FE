import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { OutboundShipmentsResponse } from '../../dto/response/OutboundShipment/OutboundShipmentResponse';
import {
  OutboundShipmentsRequest,
  UpdateOutboundShipmentsRequest
} from '../../dto/request/OutboundShipment/OutboundShipmentRequest';

@Injectable({ providedIn: 'root' })
export class OutboundService {
  private readonly apiUrl = `${BaseURL.API_URL}outbound-shipments`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/outbound-shipments */
  getAll(filters: any = {}, page = 0, size = 10): Observable<ApiResponse<PageResponse<OutboundShipmentsResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get<ApiResponse<PageResponse<OutboundShipmentsResponse>>>(this.apiUrl, { params });
  }

  /** GET /api/v1/outbound-shipments/:id */
  getById(id: string): Observable<ApiResponse<OutboundShipmentsResponse>> {
    return this.http.get<ApiResponse<OutboundShipmentsResponse>>(`${this.apiUrl}/${id}`);
  }

  /** POST /api/v1/outbound-shipments */
  create(request: OutboundShipmentsRequest): Observable<ApiResponse<OutboundShipmentsResponse>> {
    return this.http.post<ApiResponse<OutboundShipmentsResponse>>(this.apiUrl, request);
  }

  /** PUT /api/v1/outbound-shipments/:id */
  update(id: string, request: UpdateOutboundShipmentsRequest): Observable<ApiResponse<OutboundShipmentsResponse>> {
    return this.http.put<ApiResponse<OutboundShipmentsResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** PUT /api/v1/outbound-shipments/:id/start-picking */
  startPicking(id: string): Observable<ApiResponse<OutboundShipmentsResponse>> {
    return this.http.put<ApiResponse<OutboundShipmentsResponse>>(`${this.apiUrl}/${id}/start-picking`, {});
  }

  /** PUT /api/v1/outbound-shipments/:id/mark-as-packed */
  markAsPacked(id: string): Observable<ApiResponse<OutboundShipmentsResponse>> {
    return this.http.put<ApiResponse<OutboundShipmentsResponse>>(`${this.apiUrl}/${id}/mark-as-packed`, {});
  }

  /** PUT /api/v1/outbound-shipments/:id/ship */
  ship(id: string): Observable<ApiResponse<OutboundShipmentsResponse>> {
    return this.http.put<ApiResponse<OutboundShipmentsResponse>>(`${this.apiUrl}/${id}/ship`, {});
  }

  /** PUT /api/v1/outbound-shipments/:id/cancel */
  cancel(id: string): Observable<ApiResponse<OutboundShipmentsResponse>> {
    return this.http.put<ApiResponse<OutboundShipmentsResponse>>(`${this.apiUrl}/${id}/cancel`, {});
  }
}
