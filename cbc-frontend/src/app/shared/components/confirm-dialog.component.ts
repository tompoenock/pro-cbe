import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50" (click)="onCancel()">
        <div class="w-full max-w-sm rounded-xl p-6 shadow-xl" [class]="darkMode ? 'bg-slate-800' : 'bg-white'" (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              [class]="{
                'bg-red-100 text-red-600': type === 'danger',
                'bg-yellow-100 text-yellow-600': type === 'warning',
                'bg-blue-100 text-blue-600': type === 'info',
                'bg-green-100 text-green-600': type === 'success'
              }">
              @switch (type) {
                @case ('danger') {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
                }
                @case ('warning') {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
                }
                @case ('success') {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                }
                @default {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/></svg>
                }
              }
            </div>
            <h3 class="text-lg font-semibold" [class]="darkMode ? 'text-white' : 'text-gray-800'">{{ title }}</h3>
          </div>
          <p class="text-sm mb-6" [class]="darkMode ? 'text-slate-300' : 'text-gray-600'">{{ message }}</p>
          <div class="flex justify-end gap-3">
            <button (click)="onCancel()" class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              [class]="darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'">
              {{ cancelText }}
            </button>
            <button (click)="onConfirm()" class="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              [class]="{
                'bg-red-600 hover:bg-red-700': type === 'danger',
                'bg-yellow-600 hover:bg-yellow-700': type === 'warning',
                'bg-blue-600 hover:bg-blue-700': type === 'info',
                'bg-green-600 hover:bg-green-700': type === 'success'
              }">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
    @Input()
    set isOpen(val: boolean) { this.visible = val; }
    get isOpen(): boolean { return this.visible; }
  @Input() visible = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() type: 'danger' | 'warning' | 'info' | 'success' = 'danger';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() darkMode = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() { this.confirmed.emit(); }
  onCancel() { this.cancelled.emit(); }
}
