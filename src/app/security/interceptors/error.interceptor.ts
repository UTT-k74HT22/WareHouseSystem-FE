import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../service/AuthService/auth-service.service';
import { ToastrService } from '../../service/SystemService/toastr.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }

        if (error.status === 403) {
          if (!request.url.includes('/auth/my-permissions')) {
            this.authService.ensurePermissionsLoaded(true).subscribe({
              error: () => void 0
            });
          }

          this.toastr.error('Ban khong co quyen thuc hien hanh dong nay', 'Khong co quyen');
        }

        if (error.status === 500) {
          this.toastr.error('Da xay ra loi tu phia server. Vui long thu lai sau', 'Loi server');
        }

        if (error.status === 0) {
          this.toastr.error('Khong the ket noi den server. Vui long kiem tra ket noi mang', 'Loi ket noi');
        }

        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token != null),
        take(1),
        switchMap((token) => next.handle(this.addToken(request, token)))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const tokens = this.authService.getTokens();
    if (!tokens?.refreshToken) {
      this.isRefreshing = false;
      this.toastr.warning('Phien dang nhap da het han. Vui long dang nhap lai', 'Het phien');
      this.authService.logout();
      this.router.navigate(['/login']);
      return throwError(() => new Error('Token expired'));
    }

    return this.authService.refreshToken({ refresh_token: tokens.refreshToken }).pipe(
      switchMap((res) => {
        this.isRefreshing = false;

        if (!res.success || !res.data) {
          this.toastr.warning('Phien dang nhap da het han. Vui long dang nhap lai', 'Het phien');
          this.authService.logout();
          this.router.navigate(['/login']);
          return throwError(() => new Error('Token refresh failed'));
        }

        this.authService.setSession({
          accessToken: res.data.access_token,
          refreshToken: tokens.refreshToken,
          accessTokenExpiresAt: Number(res.data.expire_access_token),
          refreshTokenExpiresAt: Number(tokens.refreshTokenExpiresAt)
        });
        this.refreshTokenSubject.next(res.data.access_token);
        return next.handle(this.addToken(request, res.data.access_token));
      }),
      catchError((refreshError) => {
        this.isRefreshing = false;
        this.toastr.warning('Phien dang nhap da het han. Vui long dang nhap lai', 'Het phien');
        this.authService.logout();
        this.router.navigate(['/login']);
        return throwError(() => refreshError);
      })
    );
  }

  private addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
