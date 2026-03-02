import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { CreateBusinessPartnerRequest } from '../../dto/request/BusinessPartner/CreateBusinessPartnerRequest';
import { UpdateBusinessPartnerRequest } from '../../dto/request/BusinessPartner/UpdateBusinessPartnerRequest';
import { BusinessPartnerStatus } from '../../helper/enums/BusinessPartnerStatus';

@Injectable({ providedIn: 'root' })
export class BusinessPartnerService {
  private readonly apiUrl = `${BaseURL.API_URL}business-partners`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/business-partners */
  getAll(): Observable<ApiResponse<BusinessPartnerResponse[]>> {
    return this.http.get<ApiResponse<BusinessPartnerResponse[]>>(this.apiUrl);
  }

  /** GET /api/v1/business-partners/:id */
  getById(id: string): Observable<ApiResponse<BusinessPartnerResponse>> {
    return this.http.get<ApiResponse<BusinessPartnerResponse>>(`${this.apiUrl}/${id}`);
  }

  /** POST /api/v1/business-partners */
  create(request: CreateBusinessPartnerRequest): Observable<ApiResponse<BusinessPartnerResponse>> {
    return this.http.post<ApiResponse<BusinessPartnerResponse>>(this.apiUrl, request);
  }

  /** PUT /api/v1/business-partners/:id */
  update(id: string, request: UpdateBusinessPartnerRequest): Observable<ApiResponse<BusinessPartnerResponse>> {
    return this.http.put<ApiResponse<BusinessPartnerResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** PATCH /api/v1/business-partners/:id/status */
  changeStatus(id: string, status: BusinessPartnerStatus): Observable<ApiResponse<BusinessPartnerResponse>> {
    return this.http.patch<ApiResponse<BusinessPartnerResponse>>(
      `${this.apiUrl}/${id}/status`, { status }
    );
  }

  /** DELETE /api/v1/business-partners/:id */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
