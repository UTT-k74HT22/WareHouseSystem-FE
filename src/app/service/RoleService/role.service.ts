import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { RoleResponse } from '../../dto/response/Role/RoleResponse';
import { CreateRoleRequest, UpdateRoleRequest, AssignPermissionsRequest } from '../../dto/request/Role/RoleRequest';
import { PermissionResponse } from '../../dto/response/Permission/PermissionResponse';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly apiUrl = `${BaseURL.API_URL}roles`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 0,
    size = 10,
    isDefault?: boolean,
    search?: string
  ): Observable<ApiResponse<PageResponse<RoleResponse>>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
    if (isDefault !== undefined && isDefault !== null) {
      params = params.set('isDefault', isDefault);
    }
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<PageResponse<RoleResponse>>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<RoleResponse>> {
    return this.http.get<ApiResponse<RoleResponse>>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateRoleRequest): Observable<ApiResponse<RoleResponse>> {
    return this.http.post<ApiResponse<RoleResponse>>(this.apiUrl, request);
  }

  update(id: string, request: UpdateRoleRequest): Observable<ApiResponse<RoleResponse>> {
    return this.http.put<ApiResponse<RoleResponse>>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getPermissions(
    roleId: string,
    page = 0,
    size = 10,
    resource?: string
  ): Observable<ApiResponse<PageResponse<PermissionResponse>>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
    if (resource) params = params.set('resource', resource);
    return this.http.get<ApiResponse<PageResponse<PermissionResponse>>>(`${this.apiUrl}/${roleId}/permissions`, { params });
  }

  assignPermissions(roleId: string, request: AssignPermissionsRequest): Observable<ApiResponse<PermissionResponse[]>> {
    return this.http.post<ApiResponse<PermissionResponse[]>>(`${this.apiUrl}/${roleId}/permissions`, request);
  }

  removePermission(roleId: string, permissionId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${roleId}/permissions/${permissionId}`);
  }
}
