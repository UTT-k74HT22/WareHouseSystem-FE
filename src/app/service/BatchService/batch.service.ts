import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { BatchResponse } from '../../dto/response/Batch/BatchResponse';
import {
  ChangeBatchStatusRequest,
  CreateBatchRequest,
  UpdateBatchRequest
} from '../../dto/request/Batch/BatchRequest';

@Injectable({ providedIn: 'root' })
export class BatchService {
  private readonly apiUrl = `${BaseURL.API_URL}batches`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/batches */
  getAll(page = 0, size = 10): Observable<ApiResponse<PageResponse<BatchResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<BatchResponse>>>(this.apiUrl, { params });
  }

  /** GET /api/v1/batches/:id */
  getById(id: string): Observable<ApiResponse<BatchResponse>> {
    return this.http.get<ApiResponse<BatchResponse>>(`${this.apiUrl}/${id}`);
  }

  /** POST /api/v1/batches */
  create(request: CreateBatchRequest): Observable<ApiResponse<BatchResponse>> {
    return this.http.post<ApiResponse<BatchResponse>>(this.apiUrl, request);
  }

  /** PATCH /api/v1/batches/:id/status */
  changeStatus(id: string, request: ChangeBatchStatusRequest): Observable<ApiResponse<BatchResponse>> {
    return this.http.patch<ApiResponse<BatchResponse>>(`${this.apiUrl}/${id}/status`, request);
  }

  /** PUT /api/v1/batches/:id */
  update(id: string, request: UpdateBatchRequest): Observable<ApiResponse<BatchResponse>> {
    return this.http.put<ApiResponse<BatchResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** PUT /api/v1/batches/:id/quarantine */
  quarantine(id: string): Observable<BatchResponse> {
    return this.http.put<BatchResponse>(`${this.apiUrl}/${id}/quarantine`, {});
  }

  /** PUT /api/v1/batches/:id/release */
  release(id: string): Observable<BatchResponse> {
    return this.http.put<BatchResponse>(`${this.apiUrl}/${id}/release`, {});
  }
}
