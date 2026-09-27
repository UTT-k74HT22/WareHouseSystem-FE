import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { AuthService } from '../../service/AuthService/auth-service.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { Router } from '@angular/router';
import { ApiErrorService } from '../../service/SystemService/api-error.service';

/**
 * Error Interceptor - Xử lý các lỗi HTTP
 * - 401 Unauthorized: Token hết hạn -> refresh token hoặc logout
 * - 403 Forbidden: Không có quyền
 * - 500 Server Error: Lỗi server
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router,
    private apiError: ApiErrorService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const localizedError = this.apiError.localize(error);

        if (error.status === 401 && !this.isPublicAuthRequest(request.url)) {
          return this.handle401Error(request, next, localizedError);
        }
        return throwError(() => localizedError);
      })
    );
  }

  /** Xử lý lỗi 401 bằng cách làm mới token và thử lại request. */
  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler,
    originalError: HttpErrorResponse
  ): Observable<HttpEvent<any>> {
    // Nếu đang refresh token thì đợi
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(request, token)))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const tokens = this.authService.getTokens();
    if (!tokens?.refreshToken) {
      this.isRefreshing = false;
      this.expireSession();
      return throwError(() => originalError);
    }

    const requestSessionVersion = this.authService.getSessionVersion();
    let refreshedSessionVersion: number | null = null;

    return this.authService.refreshToken({ refresh_token: tokens.refreshToken }).pipe(
      switchMap((res) => {
        if (!this.authService.isCurrentSession(requestSessionVersion)) {
          return throwError(() => originalError);
        }

        if (res.success && res.data) {
          this.authService.setSession({
            accessToken: res.data.access_token,
            refreshToken: tokens.refreshToken,
            accessTokenExpiresAt: Number(res.data.expire_access_token),
            refreshTokenExpiresAt: Number(tokens.refreshTokenExpiresAt)
          });
          refreshedSessionVersion = this.authService.getSessionVersion();
          this.refreshTokenSubject.next(res.data.access_token);
          return next.handle(this.addToken(request, res.data.access_token));
        } else {
          this.expireSession();
          return throwError(() => originalError);
        }
      }),
      catchError((err) => {
        const errorBelongsToCurrentSession =
          this.authService.isCurrentSession(requestSessionVersion) ||
          (refreshedSessionVersion !== null && this.authService.isCurrentSession(refreshedSessionVersion));

        if (errorBelongsToCurrentSession) {
          this.expireSession();
        } else {
          this.resetRefreshWaiters('SESSION_CHANGED');
        }
        return throwError(() => this.apiError.localize(
          err instanceof HttpErrorResponse ? err : originalError
        ));
      }),
      finalize(() => this.isRefreshing = false)
    );
  }

  /**
   * Thêm token vào request
   */
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private isPublicAuthRequest(url: string): boolean {
    return url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh-token') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/verify-forgot-password-otp') ||
      url.includes('/auth/reset-password');
  }

  private expireSession(): void {
    if (this.authService.isAuthenticated()) {
      this.toastr.warning('Hết phiên', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    this.resetRefreshWaiters('SESSION_EXPIRED');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private resetRefreshWaiters(reason: 'SESSION_CHANGED' | 'SESSION_EXPIRED'): void {
    this.refreshTokenSubject.error(new Error(reason));
    this.refreshTokenSubject = new BehaviorSubject<string | null>(null);
  }
}
