import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, map, tap } from "rxjs";
import { BaseURL } from "../../../environments/BaseURL";
import { LoginRequest } from "../../dto/request/Auth/LoginRequest";
import { RegisterRequest } from "../../dto/request/Auth/RegisterRequest";
import { RefreshTokenRequest } from "../../dto/request/Auth/RefreshTokenRequest";
import { ForgotPasswordRequest } from "../../dto/request/Auth/ForgotPasswordRequest";
import { VerifyForgotPasswordRequest } from "../../dto/request/Auth/VerifyForgotPasswordRequest";
import { ResetPasswordRequest } from "../../dto/request/Auth/ResetPasswordRequest";
import { ChangePasswordRequest } from "../../dto/request/Auth/ChangePasswordRequest";
import { CheckPermissionRequest } from "../../dto/request/Permission/PermissionRequest";
import { AuthResponse } from "../../dto/response/Auth/AuthResponse";
import { RefreshTokenResponse } from "../../dto/response/Auth/RefreshTokenResponse";
import { ForgotPasswordResponse } from "../../dto/response/Auth/ForgotPasswordResponse";
import { AuthMapper } from "../../helper/mapper/Authmapper";
import { AuthState } from "../../dto/response/Auth/AuthState";
import { AuthStorageService } from "./AuthStorage/auth-storage.service";
import { AuthTokens } from "../../dto/response/Auth/AuthTokens";
import { ApiResponse } from "../../dto/response/ApiResponse";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${BaseURL.API_URL}auth`;

  private authStateSubject = new BehaviorSubject<AuthState>(this.mapper.getInitialState());
  authState$ = this.authStateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private mapper: AuthMapper,
    private storage: AuthStorageService
  ) {
    this.restoreSession();
  }

  // ==================== LOGIN ====================

  login(request: LoginRequest): Observable<AuthTokens> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, request).pipe(
      map(res => {
        const data = res.data;
        return this.mapper.mapToTokens(data);
      }),
      tap(tokens => this.setSession(tokens))
    );
  }

  // ==================== REGISTER ====================

  register(request: RegisterRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/register`, request);
  }

  // ==================== REFRESH TOKEN ====================

  refreshToken(request: RefreshTokenRequest): Observable<ApiResponse<RefreshTokenResponse>> {
    return this.http.post<ApiResponse<RefreshTokenResponse>>(`${this.apiUrl}/refresh-token`, request);
  }

  // ==================== FORGOT PASSWORD ====================

  forgotPassword(request: ForgotPasswordRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/forgot-password`, request);
  }

  // ==================== VERIFY FORGOT PASSWORD OTP ====================

  verifyForgotPasswordOtp(request: VerifyForgotPasswordRequest): Observable<ApiResponse<ForgotPasswordResponse>> {
    return this.http.post<ApiResponse<ForgotPasswordResponse>>(`${this.apiUrl}/verify-forgot-password-otp`, request);
  }

  // ==================== RESET PASSWORD ====================

  resetPassword(resetToken: string, request: ResetPasswordRequest): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${resetToken}`);
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/reset-password`, request, { headers });
  }

  // ==================== CHANGE PASSWORD ====================

  changePassword(request: ChangePasswordRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/change-password`, request);
  }

  // ==================== SESSION MANAGEMENT ====================

  setSession(tokens: AuthTokens): void {
    this.storage.saveTokens(tokens);
    const newState = this.mapper.mapToState(tokens);
    this.authStateSubject.next(newState);
  }

  private restoreSession(): void {
    const tokens = this.storage.getTokens();
    if (tokens) {
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

  getTokens(): AuthTokens | null {
    return this.authStateSubject.value.tokens;
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  isLoggedIn(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  getRoles(): string[] {
    return this.authStateSubject.value.roles;
  }

  // ==================== CHECK PERMISSION ====================

  checkPermission(request: CheckPermissionRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/check-permission`, request);
  }

  // ==================== MY PERMISSIONS ====================

  getMyPermissions(): Observable<ApiResponse<{ permissions: string[] }>> {
    return this.http.get<ApiResponse<{ permissions: string[] }>>(`${this.apiUrl}/my-permissions`);
  }
}
