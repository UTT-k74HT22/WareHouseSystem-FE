import { Injectable, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { AuthStorageService } from './AuthStorage/auth-storage.service';
import { AuthService } from './auth-service.service';
import { ToastrService } from '../SystemService/toastr.service';
import { Router } from '@angular/router';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { RefreshTokenResponse } from '../../dto/response/Auth/RefreshTokenResponse';

@Injectable({
  providedIn: 'root'
})
export class TokenExpiryService implements OnDestroy {
  private checkInterval = 60000; // Check every 60 seconds
  private warningTime = 120000; // Warn 2 minutes before expiry
  private subscription?: Subscription;

  constructor(
    private authStorage: AuthStorageService,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  startMonitoring(): void {
    if (this.subscription) {
      return;
    }

    this.subscription = interval(this.checkInterval).subscribe(() => {
      this.checkTokenExpiry();
    });
    
    this.checkTokenExpiry();
  }

  stopMonitoring(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }

  private checkTokenExpiry(): void {
    const accessExpiresAt = this.authStorage.getAccessTokenExpiresAt();
    const refreshExpiresAt = this.authStorage.getRefreshTokenExpiresAt();

    if (!accessExpiresAt || !refreshExpiresAt) {
      return;
    }

    const now = Date.now();
    const accessTimeLeft = accessExpiresAt - now;
    const refreshTimeLeft = refreshExpiresAt - now;

    if (refreshTimeLeft <= 0) {
      this.handleRefreshExpired();
      return;
    }

    if (accessTimeLeft <= 0) {
      this.handleAccessExpired();
      return;
    }

    if (accessTimeLeft <= this.warningTime) {
      this.showWarning(accessTimeLeft);
    }
  }

  private showWarning(timeLeft: number): void {
    const minutes = Math.ceil(timeLeft / 60000);
    this.toastr.warning(
      'Phiên đăng nhập sẽ hết sau ' + minutes + ' phút. Vui lòng lưu công việc.',
      'Cảnh báo phiên'
    );
  }

  private handleAccessExpired(): void {
    const refreshExpiresAt = this.authStorage.getRefreshTokenExpiresAt();
    const now = Date.now();

    if (refreshExpiresAt && refreshExpiresAt > now) {
      this.refreshToken();
    } else {
      this.handleRefreshExpired();
    }
  }

  private handleRefreshExpired(): void {
    this.toastr.warning(
      'Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.',
      'Hết phiên'
    );
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private refreshToken(): void {
    const tokens = this.authStorage.getTokens();
    if (!tokens?.refreshToken) {
      this.handleRefreshExpired();
      return;
    }

    this.authService.refreshToken({ refresh_token: tokens.refreshToken }).subscribe({
      next: (res: ApiResponse<RefreshTokenResponse>) => {
        if (res.success && res.data) {
          this.authStorage.saveTokens({
            accessToken: res.data.access_token,
            refreshToken: tokens.refreshToken,
            accessTokenExpiresAt: Number(res.data.expire_access_token),
            refreshTokenExpiresAt: Number(tokens.refreshTokenExpiresAt)
          });
          this.toastr.success('Đã làm mới phiên đăng nhập.', 'Thành công');
        } else {
          this.handleRefreshExpired();
        }
      },
      error: () => {
        this.handleRefreshExpired();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}
