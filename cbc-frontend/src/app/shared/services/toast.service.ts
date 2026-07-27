import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastState = new Subject<Toast | null>();
  toastState$ = this.toastState.asObservable();

  show(toast: Toast) {
    this.toastState.next(toast);
    if (toast.duration !== 0) {
      setTimeout(() => {
        this.toastState.next(null);
      }, toast.duration || 3000);
    }
  }

  success(message: string, duration = 3000) {
    this.show({ message, type: 'success', duration });
  }

  error(message: string, duration = 3000) {
    this.show({ message, type: 'error', duration });
  }

  info(message: string, duration = 3000) {
    this.show({ message, type: 'info', duration });
  }

  warning(message: string, duration = 3000) {
    this.show({ message, type: 'warning', duration });
  }
}
