import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastEvent {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastrService {
  private toastSubject = new Subject<ToastEvent>();
  public toastState = this.toastSubject.asObservable();

  constructor() { }

  show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration: number = 5000): void {
    this.toastSubject.next({ type, title, message, duration });
  }

  success(title: string, message: string, duration?: number): void {
    this.show('success', title, message, duration);
  }

  error(title: string, message: string, duration?: number): void {
    this.show('error', title, message, duration);
  }

  warning(title: string, message: string, duration?: number): void {
    this.show('warning', title, message, duration);
  }

  info(title: string, message: string, duration?: number): void {
    this.show('info', title, message, duration);
  }
}
