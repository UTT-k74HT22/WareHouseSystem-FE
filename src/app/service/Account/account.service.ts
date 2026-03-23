import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BaseURL} from "../../../environments/BaseURL";
import {Observable} from "rxjs";
import {ApiResponse} from "../../dto/response/ApiResponse";
import {AccountResponse} from "../../dto/response/Account/AccountResponse";

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private readonly apiUrl = `${BaseURL.API_URL}users`;

  constructor(private http: HttpClient) { }

  getUserByRoleManager(): Observable<ApiResponse<AccountResponse[]>> {
    return this.http.get<ApiResponse<AccountResponse[]>>(`${this.apiUrl}/managers`);
  }

  getUserById(id: string): Observable<ApiResponse<AccountResponse>> {
    return this.http.get<ApiResponse<AccountResponse>>(`${this.apiUrl}/${id}`);
  }
}
