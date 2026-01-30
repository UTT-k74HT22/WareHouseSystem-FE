import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../service/AuthService/auth-service.service';
import { ToastrService } from '../../../service/SystemService/toastr.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  pageTitle: string = 'Dashboard';
  pageSubtitle: string = 'Tổng quan hoạt động kho hôm nay';

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Set initial page info
    this.updatePageInfo();

    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageInfo();
      });
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
    // Navigate to profile page
    this.toastr.info('Thông báo', 'Chức năng đang được phát triển');
    // this.router.navigate(['/profile']);
  }

  changePassword(): void {
    // Navigate to change password page
    this.toastr.info('Thông báo', 'Chức năng đang được phát triển');
    // this.router.navigate(['/change-password']);
  }

  settings(): void {
    // Navigate to settings page
    this.toastr.info('Thông báo', 'Chức năng đang được phát triển');
    // this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
    this.toastr.success('Thành công', 'Đăng xuất thành công');
    this.router.navigate(['/login']);
  }
}
