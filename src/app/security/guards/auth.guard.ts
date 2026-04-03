import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { map, Observable, of, switchMap, take } from 'rxjs';
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
    return this.authService.authState$.pipe(
      take(1),
      switchMap((authState) => {
        if (!authState.isAuthenticated) {
          this.toastr.warning('Chua dang nhap', 'Vui long dang nhap de tiep tuc');
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
          return of(false);
        }

        const requiredPermissions = route.data['permissions'] as string[] | undefined;
        if (requiredPermissions && requiredPermissions.length > 0) {
          return this.authService.ensurePermissionsLoaded().pipe(
            map((permissions) => {
              const hasPermission = requiredPermissions.some((permission) => permissions.includes(permission));

              if (!hasPermission) {
                this.toastr.error('Khong co quyen', 'Ban khong co quyen truy cap trang nay');
                this.router.navigate(['/dashboard']);
                return false;
              }

              return this.hasRequiredRole(route, authState.roles);
            })
          );
        }

        return of(this.hasRequiredRole(route, authState.roles));
      })
    );
  }

  private hasRequiredRole(route: ActivatedRouteSnapshot, userRoles: string[]): boolean {
    const requiredRoles = route.data['roles'] as string[] | undefined;
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (hasRole) {
      return true;
    }

    this.toastr.error('Khong co quyen', 'Ban khong co quyen truy cap trang nay');
    this.router.navigate(['/dashboard']);
    return false;
  }
}
