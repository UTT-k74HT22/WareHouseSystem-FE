import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { OutboundShipmentLinesResponse } from '../../dto/response/OutboundShipmentLine/OutboundShipmentLineResponse';
import {
  OutboundShipmentLinesRequest,
  UpdateOutboundShipmentLinesRequest
} from '../../dto/request/OutboundShipmentLine/OutboundShipmentLineRequest';

@Injectable({ providedIn: 'root' })
export class OutboundShipmentLineService {
  private readonly apiUrl = `${BaseURL.API_URL}outbound-shipment-lines`;

  constructor(private http: HttpClient) {}

  /** POST /api/v1/outbound-shipment-lines */
  create(request: OutboundShipmentLinesRequest): Observable<ApiResponse<OutboundShipmentLinesResponse>> {
    return this.http.post<ApiResponse<OutboundShipmentLinesResponse>>(this.apiUrl, request);
  }

  /** GET /api/v1/outbound-shipment-lines/shipment/:shipmentId */
  getByShipmentId(shipmentId: string): Observable<ApiResponse<OutboundShipmentLinesResponse[]>> {
    return this.http.get<ApiResponse<OutboundShipmentLinesResponse[]>>(`${this.apiUrl}/shipment/${shipmentId}`);
  }

  /** GET /api/v1/outbound-shipment-lines/:id */
  getById(id: string): Observable<ApiResponse<OutboundShipmentLinesResponse>> {
    return this.http.get<ApiResponse<OutboundShipmentLinesResponse>>(`${this.apiUrl}/${id}`);
  }

  /** PUT /api/v1/outbound-shipment-lines/:id */
  update(id: string, request: UpdateOutboundShipmentLinesRequest): Observable<ApiResponse<OutboundShipmentLinesResponse>> {
    return this.http.put<ApiResponse<OutboundShipmentLinesResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** DELETE /api/v1/outbound-shipment-lines/:id */
  remove(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
