import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionService, PERMISSION_GROUPS, PermissionGroup, SchoolPermission } from '../../shared/services/permission.service';

interface ModulePermissionEntry {
  key: SchoolPermission;
  label: string;
  type: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'other';
}

interface ModulePermissions {
  name: string;
  icon: string;
  permissionEntries: ModulePermissionEntry[];
}

@Component({
  selector: 'app-permissions-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="w-full max-w-5xl rounded-xl shadow-xl flex flex-col max-h-[90vh]"
          [class]="darkMode ? 'bg-slate-800' : 'bg-white'">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b shrink-0"
            [class]="darkMode ? 'border-slate-700' : 'border-gray-200'">
            <div>
              <h2 class="text-lg font-semibold" [class]="darkMode ? 'text-white' : 'text-gray-900'">
                Manage Permissions
              </h2>
              <p class="text-sm mt-0.5" [class]="darkMode ? 'text-slate-400' : 'text-gray-500'">
                {{ userName }} ({{ userRole }})
              </p>
            </div>
            <button (click)="close()" class="p-1.5 rounded-lg transition-colors"
              [class]="darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Quick actions bar -->
          <div class="flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0"
            [class]="darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'">
            <div class="flex items-center gap-2">
              <input [(ngModel)]="searchTerm" (ngModelChange)="filterModules()" placeholder="Search modules..."
                class="px-3 py-1.5 rounded-lg border text-sm w-64"
                [class]="darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 placeholder-gray-400'" />
            </div>
            <div class="flex items-center gap-2">
              <button (click)="selectAll()" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                Select All
              </button>
              <button (click)="deselectAll()" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                [class]="darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'">
                Clear All
              </button>
            </div>
          </div>

          @if (loading) {
            <div class="flex justify-center py-12">
              <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }

          @if (error) {
            <div class="mx-4 mt-3 p-3 rounded-lg bg-red-100 text-red-800 text-sm">{{ error }}</div>
          }

          <!-- Permissions List -->
          <div class="flex-1 overflow-auto">
            <div class="space-y-4 p-4">
              @for (module of filteredModules; track module.name) {
                <div class="rounded-2xl border px-4 py-4"
                  [class]="darkMode
                    ? 'border-slate-700 bg-slate-800/60'
                    : 'border-gray-200 bg-white'">
                  <div class="flex flex-col gap-3">
                    <div>
                      <div class="text-sm font-semibold" [class]="darkMode ? 'text-white' : 'text-gray-900'">{{ module.name }}</div>
                      <div class="text-xs" [class]="darkMode ? 'text-slate-400' : 'text-gray-500'">
                        Manage permissions by action.
                      </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      @for (entry of module.permissionEntries; track entry.key) {
                        <label
                          class="flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                          [class]="getPermissionPillClasses(entry)">
                          <input
                            type="checkbox"
                            [checked]="selectedPermissions.has(entry.key)"
                            (change)="togglePermission(entry.key)"
                            class="h-4 w-4 rounded border-gray-300 text-current focus:ring-0"
                          />
                          <span>{{ entry.label }}</span>
                        </label>
                      }
                    </div>
                  </div>
                </div>
              }
              @if (filteredModules.length === 0 && !loading) {
                <div class="py-12 text-center" [class]="darkMode ? 'text-slate-400' : 'text-gray-500'">
                  No modules found matching "{{ searchTerm }}"
                </div>
              }
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between p-4 border-t shrink-0"
            [class]="darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'">
            <div class="flex items-center gap-4">
              <span class="text-sm font-medium" [class]="darkMode ? 'text-white' : 'text-gray-900'">
                {{ selectedPermissions.size }} permissions selected
              </span>
              <div class="flex items-center gap-3 text-xs" [class]="darkMode ? 'text-slate-400' : 'text-gray-500'">
                <span class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded bg-blue-500"></span> View
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded bg-green-500"></span> Create
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded bg-yellow-500"></span> Edit
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded bg-red-500"></span> Delete
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded bg-purple-500"></span> Approve
                </span>
              </div>
            </div>
            <div class="flex gap-3">
              <button (click)="close()" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                [class]="darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'">
                Cancel
              </button>
              <button (click)="save()" [disabled]="saving"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors">
                {{ saving ? 'Saving...' : 'Save Permissions' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class PermissionsModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() userId = '';
  @Input() userName = '';
  @Input() userRole = '';
  @Input() darkMode = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  modules: ModulePermissions[] = [];
  filteredModules: ModulePermissions[] = [];
  selectedPermissions = new Set<string>();
  searchTerm = '';
  loading = false;
  saving = false;
  error = '';

  constructor(private permissionService: PermissionService) {
    this.initModules();
  }

  private initModules() {
    // Map PERMISSION_GROUPS to table-friendly structure
    this.modules = PERMISSION_GROUPS.map(group => this.mapGroupToModule(group));
    this.filteredModules = this.modules;
  }

  private mapGroupToModule(group: PermissionGroup): ModulePermissions {
    const permissionEntries: ModulePermissionEntry[] = [];

    group.permissions.forEach(perm => {
      const keyUpper = perm.key.toUpperCase();
      if (keyUpper.startsWith('VIEW_') || keyUpper === 'VIEW_DASHBOARD') {
        permissionEntries.push({ key: perm.key, label: 'View', type: 'view' });
      } else if (keyUpper.startsWith('CREATE_') || keyUpper === 'TAKE_ATTENDANCE') {
        permissionEntries.push({ key: perm.key, label: 'Create', type: 'create' });
      } else if (keyUpper.startsWith('EDIT_')) {
        permissionEntries.push({ key: perm.key, label: 'Edit', type: 'edit' });
      } else if (keyUpper.startsWith('DELETE_')) {
        permissionEntries.push({ key: perm.key, label: 'Delete', type: 'delete' });
      } else if (keyUpper.startsWith('APPROVE_')) {
        permissionEntries.push({ key: perm.key, label: 'Approve', type: 'approve' });
      } else {
        permissionEntries.push({ key: perm.key, label: perm.label, type: 'other' });
      }
    });

    return {
      name: group.name,
      icon: group.icon,
      permissionEntries,
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.userId) {
      this.loadPermissions();
    }
    if (changes['isOpen'] && !this.isOpen) {
      this.searchTerm = '';
      this.filteredModules = this.modules;
    }
  }

  loadPermissions() {
    this.loading = true;
    this.error = '';
    this.permissionService.getUserPermissions(this.userId).subscribe({
      next: (perms: string[]) => {
        this.selectedPermissions = new Set(perms);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.selectedPermissions = new Set();
      },
    });
  }

  filterModules() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredModules = this.modules;
    } else {
      this.filteredModules = this.modules.filter(m =>
        m.name.toLowerCase().includes(term)
      );
    }
  }

  togglePermission(key: SchoolPermission) {
    if (this.selectedPermissions.has(key)) {
      this.selectedPermissions.delete(key);
    } else {
      this.selectedPermissions.add(key);
    }
  }

  getModulePermissions(module: ModulePermissions): SchoolPermission[] {
    return module.permissionEntries.map(entry => entry.key);
  }

  getPermissionPillClasses(entry: ModulePermissionEntry): string {
    const base = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border';
    const active = this.selectedPermissions.has(entry.key);
    const typeClasses: Record<string, string> = {
      view: active ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700',
      create: active ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700',
      edit: active ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700',
      delete: active ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700',
      approve: active ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700',
      other: active ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700',
    };
    return `${base} ${typeClasses[entry.type]}`;
  }

  isModuleAllSelected(module: ModulePermissions): boolean {
    const perms = this.getModulePermissions(module);
    return perms.length > 0 && perms.every(p => this.selectedPermissions.has(p));
  }

  isModulePartiallySelected(module: ModulePermissions): boolean {
    const perms = this.getModulePermissions(module);
    const selectedCount = perms.filter(p => this.selectedPermissions.has(p)).length;
    return selectedCount > 0 && selectedCount < perms.length;
  }

  toggleModuleAll(module: ModulePermissions) {
    const perms = this.getModulePermissions(module);
    if (this.isModuleAllSelected(module)) {
      perms.forEach(p => this.selectedPermissions.delete(p));
    } else {
      perms.forEach(p => this.selectedPermissions.add(p));
    }
  }

  getOtherSelectedCount(module: ModulePermissions): number {
    return module.permissionEntries.filter(entry => entry.type === 'other' && this.selectedPermissions.has(entry.key)).length;
  }

  selectAll() {
    this.modules.forEach(module => {
      this.getModulePermissions(module).forEach(p => this.selectedPermissions.add(p));
    });
  }

  deselectAll() {
    this.selectedPermissions.clear();
  }

  save() {
    this.saving = true;
    this.error = '';
    this.permissionService.updateUserPermissions(this.userId, Array.from(this.selectedPermissions)).subscribe({
      next: () => {
        this.saving = false;
        this.saved.emit();
        this.close();
      },
      error: (err: any) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to save permissions';
      },
    });
  }

  close() {
    this.closed.emit();
  }
}
