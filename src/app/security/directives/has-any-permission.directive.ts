import { Directive, Input, OnChanges, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../service/AuthService/auth-service.service';

@Directive({
  selector: '[appHasAnyPermission]',
  standalone: true
})
export class HasAnyPermissionDirective implements OnInit, OnChanges, OnDestroy {
  @Input('appHasAnyPermission') requiredPermissions: string[] | string | null = [];

  private authSubscription: Subscription | null = null;
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.authState$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnChanges(): void {
    this.updateView();
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  private updateView(): void {
    const requiredPermissions = this.normalizePermissions(this.requiredPermissions);
    const shouldRender = requiredPermissions.length === 0 || this.authService.hasAnyPermission(requiredPermissions);

    if (shouldRender && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
      return;
    }

    if (!shouldRender && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private normalizePermissions(requiredPermissions: string[] | string | null): string[] {
    if (!requiredPermissions) {
      return [];
    }

    if (Array.isArray(requiredPermissions)) {
      return requiredPermissions.filter((permission) => !!permission);
    }

    return requiredPermissions ? [requiredPermissions] : [];
  }
}
