import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { CategoryResponse } from '../../dto/response/Category/CategoryResponse';
import { CreateCategoryRequest } from '../../dto/request/Category/CreateCategoryRequest';
import { UpdateCategoryRequest } from '../../dto/request/Category/UpdateCategoryRequest';
import { UpdateCategoryStatusRequest } from '../../dto/request/Category/UpdateCategoryStatusRequest';
import { CategoryStatus } from '../../helper/enums/CategoryStatus';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiUrl = `${BaseURL.API_URL}categories`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/categories */
  getAll(page = 0, size = 10, status?: CategoryStatus): Observable<ApiResponse<PageResponse<CategoryResponse>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<ApiResponse<PageResponse<CategoryResponse>>>(this.apiUrl, { params });
  }

  /** GET /api/v1/categories/:id */
  getById(id: string): Observable<ApiResponse<CategoryResponse>> {
    return this.http.get<ApiResponse<CategoryResponse>>(`${this.apiUrl}/${id}`);
  }

  /** POST /api/v1/categories */
  create(request: CreateCategoryRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.post<ApiResponse<CategoryResponse>>(this.apiUrl, request);
  }

  /** PUT /api/v1/categories/:id */
  update(id: string, request: UpdateCategoryRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.put<ApiResponse<CategoryResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** PATCH /api/v1/categories/:id/status */
  changeStatus(id: string, request: UpdateCategoryStatusRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.patch<ApiResponse<CategoryResponse>>(`${this.apiUrl}/${id}/status`, request);
  }

  /** DELETE /api/v1/categories/:id */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
