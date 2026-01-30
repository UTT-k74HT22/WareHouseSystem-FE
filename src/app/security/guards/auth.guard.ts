import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../../service/AuthService/auth-service.service';
import { ToastrService } from '../../service/SystemService/toastr.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Sử dụng observable để đảm bảo lấy state mới nhất
    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        // Check nếu user đã đăng nhập
        if (authState.isAuthenticated) {
          // Kiểm tra roles nếu route yêu cầu (optional)
          const requiredRoles = route.data['roles'] as Array<string>;
          if (requiredRoles && requiredRoles.length > 0) {
            const userRoles = authState.roles;
            const hasRole = requiredRoles.some(role => userRoles.includes(role));

            if (!hasRole) {
              this.toastr.error('Không có quyền', 'Bạn không có quyền truy cập trang này');
              this.router.navigate(['/dashboard']);
              return false;
            }
          }

          return true;
        }

        // Chưa đăng nhập -> redirect về login
        this.toastr.warning('Chưa đăng nhập', 'Vui lòng đăng nhập để tiếp tục');
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      })
    );
  }
}
