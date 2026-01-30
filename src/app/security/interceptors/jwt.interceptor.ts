import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../service/AuthService/auth-service.service';

/**
 * JWT Interceptor - Tự động thêm access token vào mọi HTTP request
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Lấy access token
    const accessToken = this.authService.getAccessToken();

    // Nếu có token và không phải request login/register thì thêm vào header
    if (accessToken && !this.isAuthRequest(request.url)) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    }

    return next.handle(request);
  }

  /**
   * Check xem có phải request đến auth endpoint không
   * Không cần thêm token cho login/register
   */
  private isAuthRequest(url: string): boolean {
    return url.includes('/auth/login') ||
           url.includes('/auth/register') ||
           url.includes('/auth/refresh');
  }
}
