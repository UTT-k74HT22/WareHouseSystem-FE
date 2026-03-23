import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../../service/AuthService/auth-service.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { Router } from '@angular/router';

/**
 * Error Interceptor - Xử lý các lỗi HTTP
 * - 401 Unauthorized: Token hết hạn -> refresh token hoặc logout
 * - 403 Forbidden: Không có quyền
 * - 500 Server Error: Lỗi server
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {

        // Xử lý lỗi 401 Unauthorized
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }

        // Xử lý lỗi 403 Forbidden
        if (error.status === 403) {
          this.toastr.error('Bạn không có quyền thực hiện hành động này', 'Không có quyền');
        }

        // Xử lý lỗi 500 Internal Server Error
        if (error.status === 500) {
          this.toastr.error('Đã xảy ra lỗi từ phía server. Vui lòng thử lại sau', 'Lỗi server');
        }

        // Xử lý lỗi 0 - Không kết nối được server
        if (error.status === 0) {
          this.toastr.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng', 'Lỗi kết nối');
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Xử lý lỗi 401 - Token hết hạn
   * TODO: Implement refresh token logic khi backend có API refresh
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Nếu đang refresh token thì đợi
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token));
        })
      );
    }

    // TODO: Khi backend có API refresh token, uncomment phần này
    // this.isRefreshing = true;
    // this.refreshTokenSubject.next(null);
    //
    // return this.authService.refreshToken().pipe(
    //   switchMap((tokens: any) => {
    //     this.isRefreshing = false;
    //     this.refreshTokenSubject.next(tokens.accessToken);
    //     return next.handle(this.addToken(request, tokens.accessToken));
    //   }),
    //   catchError((err) => {
    //     this.isRefreshing = false;
    //     this.authService.logout();
    //     this.router.navigate(['/login']);
    //     return throwError(() => err);
    //   })
    // );

    // Tạm thời: Logout và redirect về login
    this.toastr.warning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại', 'Hết phiên');
    this.authService.logout();
    this.router.navigate(['/login']);
    return throwError(() => new Error('Token expired'));
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
}
