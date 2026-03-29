import { Component, Output, EventEmitter, OnDestroy, OnInit, Input } from '@angular/core';
import { SIDEBAR_NAV_SECTIONS } from '../../../helper/constraint/sidebar-nav';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  readonly navSections = SIDEBAR_NAV_SECTIONS;

  @Input() mobileOpen = false;
  @Output() mobileClose = new EventEmitter<void>();

  isCollapsed = true;
  isHovered = false;
  isPinnedExpanded = false;
  private destroy$ = new Subject<void>();

  @Output() collapsedChange = new EventEmitter<boolean>();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.emitCollapsedState();
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.resetSidebarState();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get shouldExpand(): boolean {
    return this.isPinnedExpanded || this.isHovered || this.mobileOpen;
  }

  onMouseEnter(): void {
    if (!this.isPinnedExpanded) {
      this.isHovered = true;
      this.emitCollapsedState();
    }
  }

  onMouseLeave(): void {
    if (!this.isPinnedExpanded) {
      this.isHovered = false;
      this.emitCollapsedState();
    }
  }

  toggleSidebar(): void {
    this.isPinnedExpanded = !this.isPinnedExpanded;
    this.isHovered = false;
    this.emitCollapsedState();
  }

  private resetSidebarState(): void {
    if (!this.isPinnedExpanded) {
      this.isHovered = false;
      this.emitCollapsedState();
    }
  }

  private emitCollapsedState(): void {
    this.isCollapsed = !this.shouldExpand;
    this.collapsedChange.emit(this.isCollapsed);
  }
}
