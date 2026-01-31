import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, map, tap } from "rxjs";
import { LoginRequest } from "../../dto/request/Auth/LoginRequest";
import { AuthResponse } from "../../dto/response/Auth/AuthResponse";
import {AuthMapper} from "../../helper/mapper/Authmapper";
import {AuthState} from "../../dto/response/Auth/AuthState";
import {AuthStorageService} from "./AuthStorage/auth-storage.service";
import {AuthTokens} from "../../dto/response/Auth/AuthTokens";
import {ApiResponse} from "../../dto/response/ApiResponse";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/auth';

  // Quản lý trạng thái đăng nhập trong toàn ứng dụng
  private authStateSubject = new BehaviorSubject<AuthState>(this.mapper.getInitialState());
  authState$ = this.authStateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private mapper: AuthMapper,
    private storage: AuthStorageService
  ) {
    this.restoreSession(); // Tự động hồi phục phiên đăng nhập khi F5 trang web
  }

  /**
   * Call API đăng nhập
   * @param request username và password
   */
  login(request: LoginRequest): Observable<AuthTokens> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, request).pipe(
      map(res => {
        // res: ApiResponse<AuthResponse>
        const data = res.data;
        // thêm debug nếu muốn
        // console.log('login response data: ', data);
        return this.mapper.mapToTokens(data);
      }),
      tap(tokens => this.setSession(tokens))
    );
  }

  private setSession(tokens: AuthTokens): void {
    this.storage.saveTokens(tokens);
    const newState = this.mapper.mapToState(tokens);
    this.authStateSubject.next(newState);
  }

  private restoreSession(): void {
    const tokens = this.storage.getTokens();
    if (tokens) {
      // Ở đây bạn có thể thêm check hết hạn token trước khi map
      this.authStateSubject.next(this.mapper.mapToState(tokens));
    }
  }

  logout(): void {
    this.storage.clear();
    this.authStateSubject.next(this.mapper.getInitialState());
  }

  getAccessToken(): string | null {
    return this.authStateSubject.value.tokens?.accessToken ?? null;
  }

  isLoggedIn(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  getRoles(): string[] {
    return this.authStateSubject.value.roles;
  }
}
