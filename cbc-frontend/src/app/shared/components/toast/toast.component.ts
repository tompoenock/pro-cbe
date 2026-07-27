import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="(toast$ | async) as toast">
       <div *ngIf="toast.type"
         class="fixed top-4 right-4 z-50 min-w-50 max-w-sm animate-slide-in"
           [ngClass]="{
             'bg-green-100 text-green-800 border-green-300': toast.type === 'success',
             'bg-red-100 text-red-800 border-red-300': toast.type === 'error',
             'bg-blue-100 text-blue-800 border-blue-300': toast.type === 'info',
             'bg-yellow-100 text-yellow-800 border-yellow-300': toast.type === 'warning'
           }">
        <div class="p-4 rounded-lg border shadow-lg">
          <div class="flex items-start">
            <div class="shrink-0">
              <span [ngSwitch]="toast.type">
                <span *ngSwitchCase="'success'">✅</span>
                <span *ngSwitchCase="'error'">❌</span>
                <span *ngSwitchCase="'info'">ℹ️</span>
                <span *ngSwitchCase="'warning'">⚠️</span>
              </span>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium">{{ toast.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `]
})
export class ToastComponent implements OnInit {
  toast$: Observable<Toast | null>;
  private toastService = inject(ToastService);

  constructor() {
    this.toast$ = this.toastService.toastState$;
  }

  ngOnInit(): void {}
}
