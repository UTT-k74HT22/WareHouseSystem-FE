import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { Subscription } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Component({
  selector: 'app-toastr',
  templateUrl: './toastr.component.html',
  styleUrls: ['./toastr.component.css'],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastrComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private toastId = 0;
  private subscription: Subscription | undefined;
  private dismissTimer: ReturnType<typeof setTimeout> | undefined;
  private activeToastId: number | null = null;
  private remainingDismissTime = 0;
  private dismissStartedAt = 0;
  private isDismissPaused = false;

  constructor(private toastrService: ToastrService) {}

  ngOnInit(): void {
    this.subscription = this.toastrService.toastState.subscribe(event => {
      this.showToast(event.type, event.title, event.message, event.duration);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.clearDismissTimer();
  }

  showToast(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration: number = 5000): void {
    const toast: Toast = {
      id: ++this.toastId,
      type,
      title,
      message,
      duration
    };

    this.clearDismissTimer();
    this.toasts = [toast];
    this.activeToastId = toast.id;
    this.remainingDismissTime = Math.max(duration, 0);
    this.isDismissPaused = false;

    if (duration > 0) {
      this.startDismissTimer(toast.id);
    }
  }

  success(title: string, message: string, duration?: number): void {
    this.showToast('success', title, message, duration);
  }

  error(title: string, message: string, duration?: number): void {
    this.showToast('error', title, message, duration);
  }

  warning(title: string, message: string, duration?: number): void {
    this.showToast('warning', title, message, duration);
  }

  info(title: string, message: string, duration?: number): void {
    this.showToast('info', title, message, duration);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    if (this.toasts.length === 0 || this.activeToastId === id) {
      this.clearDismissTimer();
      this.activeToastId = null;
      this.remainingDismissTime = 0;
      this.dismissStartedAt = 0;
      this.isDismissPaused = false;
    }
  }

  pauseDismiss(id: number): void {
    if (id !== this.activeToastId || this.isDismissPaused || this.remainingDismissTime <= 0) {
      return;
    }

    const elapsed = Date.now() - this.dismissStartedAt;
    this.remainingDismissTime = Math.max(0, this.remainingDismissTime - elapsed);
    this.clearDismissTimer();
    this.isDismissPaused = true;
  }

  resumeDismiss(id: number): void {
    if (id !== this.activeToastId || !this.isDismissPaused) {
      return;
    }

    this.isDismissPaused = false;
    if (this.remainingDismissTime > 0) {
      this.startDismissTimer(id);
    }
  }

  isToastPaused(id: number): boolean {
    return id === this.activeToastId && this.isDismissPaused;
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer !== undefined) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = undefined;
    }
  }

  private startDismissTimer(id: number): void {
    this.dismissStartedAt = Date.now();
    this.dismissTimer = setTimeout(() => {
      this.removeToast(id);
    }, this.remainingDismissTime);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'fa-solid fa-check';
      case 'error':
        return 'fa-solid fa-xmark';
      case 'warning':
        return 'fa-solid fa-triangle-exclamation';
      case 'info':
        return 'fa-solid fa-circle-info';
      default:
        return 'fa-solid fa-circle-info';
    }
  }
}
