import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { EmployeeResponse } from '../../dto/response/Employee/EmployeeResponse';
import { CreateEmployeeRequest } from '../../dto/request/Employee/CreateEmployeeRequest';
import { UpdateEmployeeRequest } from '../../dto/request/Employee/UpdateEmployeeRequest';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly apiUrl = `${BaseURL.API_URL}employees`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 0,
    size = 10,
    keyword?: string,
    status?: string,
    warehouseId?: string
  ): Observable<ApiResponse<PageResponse<EmployeeResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (keyword) {
      params = params.set('keyword', keyword);
    }
    if (status) {
      params = params.set('status', status);
    }
    if (warehouseId) {
      params = params.set('warehouseId', warehouseId);
    }

    return this.http.get<ApiResponse<PageResponse<EmployeeResponse>>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<EmployeeResponse>> {
    return this.http.get<ApiResponse<EmployeeResponse>>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateEmployeeRequest): Observable<ApiResponse<EmployeeResponse>> {
    return this.http.post<ApiResponse<EmployeeResponse>>(this.apiUrl, request);
  }

  update(id: string, request: UpdateEmployeeRequest): Observable<ApiResponse<EmployeeResponse>> {
    return this.http.put<ApiResponse<EmployeeResponse>>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
