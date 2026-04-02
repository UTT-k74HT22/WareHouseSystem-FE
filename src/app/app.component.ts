import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './service/AuthService/auth-service.service';
import { TokenExpiryService } from './service/AuthService/token-expiry.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Ware House System';
  showLayout = false;
  sidebarCollapsed = false;
  mobileSidebarOpen = false;

  // Public auth routes that should render without sidebar/header/footer
  private routesWithoutLayout = [
    '/login',
    '/register',
    '/forgot-password',
    '/verify-otp',
    '/reset-password',
    '/home'
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private tokenExpiryService: TokenExpiryService
  ) {}

  ngOnInit() {
    // Check route changes to determine if layout should be shown
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateLayoutVisibility();
    });

    // Initial check
    this.updateLayoutVisibility();
  }

  private updateLayoutVisibility(): void {
    const currentUrl = this.router.url;
    const path = currentUrl.split('?')[0].split('#')[0];

    // Hide layout for landing page (root URL or hash routes)
    if (path === '/' || currentUrl.startsWith('/#') || currentUrl === '/home') {
      this.showLayout = false;
      return;
    }

    // Hide layout for public auth routes
    const isRouteWithoutLayout = this.routesWithoutLayout.some(route =>
      path === route
    );

    if (isRouteWithoutLayout) {
      this.showLayout = false;
      this.tokenExpiryService.stopMonitoring();
      return;
    }

    // Hide layout for 404 (check if route component is NotFoundComponent)
    const isNotFoundPage = this.isNotFoundRoute();
    if (isNotFoundPage) {
      this.showLayout = false;
      return;
    }

    // Show layout for all other valid routes
    this.showLayout = true;
    
    // Start token expiry monitoring when logged in
    if (this.authService.isAuthenticated()) {
      this.tokenExpiryService.startMonitoring();
    }
  }

  private isNotFoundRoute(): boolean {
    // Get the root activated route
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    // Check if the component name includes 'NotFound'
    const componentName = route.component?.name || '';
    return componentName.includes('NotFound');
  }

  onSidebarCollapsedChange(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 310);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
  }

  onMobileSidebarToggle(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }
}
