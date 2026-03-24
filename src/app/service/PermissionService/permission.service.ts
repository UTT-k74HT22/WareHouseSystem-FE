import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { PermissionResponse } from '../../dto/response/Permission/PermissionResponse';
import { CreatePermissionRequest, UpdatePermissionRequest } from '../../dto/request/Permission/PermissionRequest';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly apiUrl = `${BaseURL.API_URL}permissions`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 0,
    size = 10,
    resource?: string,
    action?: string,
    search?: string
  ): Observable<ApiResponse<PageResponse<PermissionResponse>>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
    if (resource) params = params.set('resource', resource);
    if (action) params = params.set('action', action);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<PageResponse<PermissionResponse>>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<PermissionResponse>> {
    return this.http.get<ApiResponse<PermissionResponse>>(`${this.apiUrl}/${id}`);
  }

  create(request: CreatePermissionRequest): Observable<ApiResponse<PermissionResponse>> {
    return this.http.post<ApiResponse<PermissionResponse>>(this.apiUrl, request);
  }

  update(id: string, request: UpdatePermissionRequest): Observable<ApiResponse<PermissionResponse>> {
    return this.http.put<ApiResponse<PermissionResponse>>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
