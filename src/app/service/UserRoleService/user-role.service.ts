import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { RoleResponse } from '../../dto/response/Role/RoleResponse';
import { AccountResponse } from '../../dto/response/Account/AccountResponse';
import { AssignRolesRequest } from '../../dto/request/Role/RoleRequest';

@Injectable({ providedIn: 'root' })
export class UserRoleService {
  private readonly apiUrl = `${BaseURL.API_URL}users`;

  constructor(private http: HttpClient) {}

  assignRolesToUser(
    userId: string,
    request: AssignRolesRequest
  ): Observable<ApiResponse<RoleResponse[]>> {
    return this.http.post<ApiResponse<RoleResponse[]>>(
      `${this.apiUrl}/${userId}/roles`,
      request
    );
  }

  removeRoleFromUser(
    userId: string,
    roleId: string
  ): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${userId}/roles/${roleId}`
    );
  }

  getUserRoles(
    userId: string,
    page = 0,
    size = 10
  ): Observable<ApiResponse<PageResponse<RoleResponse>>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<ApiResponse<PageResponse<RoleResponse>>>(
      `${this.apiUrl}/${userId}/roles`,
      { params }
    );
  }

  getRoleUsers(
    roleId: string,
    page = 0,
    size = 10
  ): Observable<ApiResponse<PageResponse<AccountResponse>>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<ApiResponse<PageResponse<AccountResponse>>>(
      `${BaseURL.API_URL}roles/${roleId}/users`,
      { params }
    );
  }

  removeAllRolesFromUser(userId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${userId}/roles/all`
    );
  }
}
