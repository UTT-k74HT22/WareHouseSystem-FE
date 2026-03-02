import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Ware House System';
  showLayout = false;
  sidebarCollapsed = false;

  // Routes that should NOT show the layout (sidebar/header/footer)
  private routesWithoutLayout = ['/login', '/register'];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
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

    // Hide layout for specific routes (login, register)
    const isRouteWithoutLayout = this.routesWithoutLayout.some(route =>
      currentUrl.includes(route)
    );

    if (isRouteWithoutLayout) {
      this.showLayout = false;
      return;
    }

    // Hide layout for 404 (check if route component is NotFoundComponent)
    const isNotFoundPage = this.isNotFoundRoute();
    if (isNotFoundPage) {
      this.showLayout = false;
      return;
    }

    // Show layout for all other valid routes
    this.showLayout = currentUrl !== '/';
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
  }
}
