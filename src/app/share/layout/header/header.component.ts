import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../service/AuthService/auth-service.service';
import { ToastrService } from '../../../service/SystemService/toastr.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  pageTitle: string = 'Dashboard';
  pageSubtitle: string = 'Tổng quan hoạt động kho hôm nay';

  username: string = 'Admin';
  avatarInitial: string = 'A';
  roleDisplay: string = 'Warehouse Staff';

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.updatePageInfo();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => this.updatePageInfo());

    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.isAuthenticated && state.username) {
          this.username = state.username;
          this.avatarInitial = state.username.charAt(0).toUpperCase();
          const roles = state.roles || [];
          if (roles.some(r => r.includes('ADMIN'))) {
            this.roleDisplay = 'Administrator';
          } else if (roles.some(r => r.includes('MANAGER'))) {
            this.roleDisplay = 'Warehouse Manager';
          } else {
            this.roleDisplay = 'Warehouse Staff';
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updatePageInfo(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    route.data.subscribe(data => {
      this.pageTitle = data['title'] || 'Dashboard';
      this.pageSubtitle = data['subtitle'] || '';
    });
  }

  viewProfile(): void {
    this.toastr.info('Thông báo', 'Chức năng đang được phát triển');
  }

  changePassword(): void {
    this.toastr.info('Thông báo', 'Chức năng đang được phát triển');
  }

  settings(): void {
    this.toastr.info('Thông báo', 'Chức năng đang được phát triển');
  }

  logout(): void {
    this.authService.logout();
    this.toastr.success('Thành công', 'Đăng xuất thành công');
    this.router.navigate(['/login']);
  }
}

