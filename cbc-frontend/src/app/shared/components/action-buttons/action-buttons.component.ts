import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ActionType = 'view' | 'edit' | 'delete' | 'approve' | 'reject' | 'permissions' | 'download' | 'print' | 'email' | 'add' | 'refresh' | 'resetPassword' | 'custom';

export interface ActionButton {
  type: ActionType;
  label?: string;
  show?: boolean;
  disabled?: boolean;
  tooltip?: string;
}

@Component({
  selector: 'app-action-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-1">
      @for (action of visibleActions; track action.type) {
        @if (action.type === 'custom') {
          <button
            (click)="onAction(action.type)"
            [disabled]="action.disabled"
            [title]="action.tooltip || action.label"
            class="px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            [ngClass]="getCustomButtonClasses()">
            {{ action.label || 'Action' }}
          </button>
        } @else {
          <button
            (click)="onAction(action.type)"
            [disabled]="action.disabled"
            [title]="action.tooltip || action.label || getDefaultLabel(action.type)"
            class="p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            [ngClass]="getButtonClasses(action.type)">
            <ng-container [ngSwitch]="action.type">
              <!-- View -->
              <svg *ngSwitchCase="'view'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>

              <!-- Edit -->
              <svg *ngSwitchCase="'edit'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
              </svg>

              <!-- Delete -->
              <svg *ngSwitchCase="'delete'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
              </svg>

              <!-- Approve -->
              <svg *ngSwitchCase="'approve'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>

              <!-- Reject -->
              <svg *ngSwitchCase="'reject'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>

              <!-- Permissions -->
              <svg *ngSwitchCase="'permissions'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
              </svg>

              <!-- Download -->
              <svg *ngSwitchCase="'download'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>

              <!-- Print -->
              <svg *ngSwitchCase="'print'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"/>
              </svg>

              <!-- Email -->
              <svg *ngSwitchCase="'email'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>
              </svg>

              <!-- Add -->
              <svg *ngSwitchCase="'add'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>

              <!-- Refresh -->
              <svg *ngSwitchCase="'refresh'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>

              <!-- Reset Password -->
              <svg *ngSwitchCase="'resetPassword'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"/>
              </svg>
            </ng-container>
          </button>
        }
      }
    </div>
  `,
})
export class ActionButtonsComponent {
  @Input() actions: ActionButton[] = [];
  @Input() darkMode = false;
  @Output() actionClick = new EventEmitter<ActionType>();

  get visibleActions(): ActionButton[] {
    return this.actions.filter(a => a.show !== false);
  }

  onAction(type: ActionType) {
    this.actionClick.emit(type);
  }

  getCustomButtonClasses(): string {
    return this.darkMode
      ? 'bg-purple-600 hover:bg-purple-700 text-white'
      : 'bg-purple-500 hover:bg-purple-600 text-white';
  }

  getDefaultLabel(type: ActionType): string {
    const labels: Record<ActionType, string> = {
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
      approve: 'Approve',
      reject: 'Reject',
      permissions: 'Permissions',
      download: 'Download',
      print: 'Print',
      email: 'Email',
      add: 'Add',
      refresh: 'Refresh',
      resetPassword: 'Reset Password',
      custom: 'Action',
    };
    return labels[type];
  }

  getButtonClasses(type: ActionType): string {
    const baseClasses = this.darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100';
    const colorClasses: Record<ActionType, string> = {
      view: this.darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700',
      edit: this.darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700',
      delete: this.darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700',
      approve: this.darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700',
      reject: this.darkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700',
      permissions: this.darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700',
      download: this.darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700',
      print: this.darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700',
      email: this.darkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700',
      add: this.darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700',
      refresh: this.darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-700',
      resetPassword: this.darkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700',
      custom: '',
    };
    return `${baseClasses} ${colorClasses[type]}`;
  }
}

