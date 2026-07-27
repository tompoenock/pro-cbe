import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" (click)="close.emit()">
        <div class="w-full rounded-xl p-6 shadow-xl overflow-y-auto max-h-[90vh]"
          [class]="(darkMode ? 'bg-slate-800' : 'bg-white') + ' ' + sizeClass"
          (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold" [class]="darkMode ? 'text-white' : 'text-gray-800'">{{ title }}</h3>
            <button (click)="close.emit()" class="p-1 rounded-lg transition-colors"
              [class]="darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div>
            @if (fields.length > 0) {
              <div class="space-y-3">
                @for (field of fields; track field.label) {
                  <div class="flex flex-col">
                    <span class="text-xs font-medium uppercase tracking-wider mb-1" [class]="darkMode ? 'text-slate-400' : 'text-gray-500'">{{ field.label }}</span>
                    <span class="text-sm" [class]="darkMode ? 'text-white' : 'text-gray-900'">{{ field.value || '-' }}</span>
                  </div>
                }
              </div>
            }
            <ng-content></ng-content>
          </div>
          <div class="flex justify-end mt-6">
            <button (click)="close.emit()" class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              [class]="darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'">
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ViewModalComponent {
    @Input()
    set isOpen(val: boolean) { this.visible = val; }
    get isOpen(): boolean { return this.visible; }
  @Input() visible = false;
  @Input() title = 'Details';
  @Input() darkMode = false;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() fields: { label: string; value: string }[] = [];
  @Output() close = new EventEmitter<void>();

  get sizeClass(): string {
    const sizes: Record<string, string> = {
      sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl',
    };
    return sizes[this.size] || 'max-w-md';
  }
}
