import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {BaseURL} from "../../../environments/BaseURL";
import {Observable} from "rxjs";
import {ApiResponse} from "../../dto/response/ApiResponse";
import {AccountResponse} from "../../dto/response/Account/AccountResponse";
import {PageResponse} from "../../dto/response/PageResponse";
import {ResetUserPasswordRequest, UpdateUserRequest} from "../../dto/request/User/UserRequest";

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private readonly apiUrl = `${BaseURL.API_URL}users`;

  constructor(private http: HttpClient) { }

  getAll(
    page = 0,
    size = 10,
    search?: string,
    status?: string
  ): Observable<ApiResponse<PageResponse<AccountResponse>>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<PageResponse<AccountResponse>>>(this.apiUrl, { params });
  }

  getUserByRoleManager(): Observable<ApiResponse<AccountResponse[]>> {
    return this.http.get<ApiResponse<AccountResponse[]>>(`${this.apiUrl}/managers`);
  }

  getUserById(id: string): Observable<ApiResponse<AccountResponse>> {
    return this.http.get<ApiResponse<AccountResponse>>(`${this.apiUrl}/${id}`);
  }

  update(
    id: string,
    request: UpdateUserRequest
  ): Observable<ApiResponse<AccountResponse>> {
    return this.http.put<ApiResponse<AccountResponse>>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  resetPassword(
    id: string,
    request: ResetUserPasswordRequest
  ): Observable<ApiResponse<AccountResponse>> {
    return this.http.post<ApiResponse<AccountResponse>>(
      `${this.apiUrl}/${id}/reset-password`,
      request
    );
  }
}
