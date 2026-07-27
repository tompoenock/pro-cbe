import { Component, OnInit, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../authentication/core/auth/auth.service';
import { OrganizationService } from '../../services/organization.service';
import { BranchService } from '../../services/branch.service';
import { OrgContextService } from '../../services/org-context.service';

@Component({
  selector: 'app-branch-switcher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Branch Switcher for Admin/Super Admin -->
    @if (isSuperAdmin || isAdmin) {
      <div class="relative branch-dropdown-container">
        <button (click)="toggleDropdown()"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors"
                [class]="darkMode ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"/>
          </svg>
          <span class="text-sm font-medium max-w-32 truncate">{{ getCurrentBranchName() }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
          </svg>
        </button>

        <!-- Branch Dropdown -->
        @if (showDropdown) {
          <div class="absolute left-0 top-full mt-2 w-72 rounded-xl shadow-lg overflow-hidden z-50 border"
               [class]="darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
            <!-- Header -->
            <div class="px-4 py-3 border-b"
                 [class]="darkMode ? 'border-slate-700' : 'border-gray-100'">
              <span class="text-sm font-semibold" [class]="darkMode ? 'text-white' : 'text-gray-800'">Switch Branch</span>
            </div>

            <!-- Organization selector (Super Admin only) -->
            @if (isSuperAdmin) {
              <div class="px-4 py-2 border-b" [class]="darkMode ? 'border-slate-700' : 'border-gray-100'">
                <label class="block text-xs font-medium mb-1" [class]="darkMode ? 'text-slate-400' : 'text-gray-500'">Organization</label>
                <select [ngModel]="selectedOrgId" (ngModelChange)="onOrgChange($event)"
                        class="w-full px-2 py-1.5 rounded-lg border text-sm"
                        [class]="darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-700'">
                  <option value="">Select Organization</option>
                  @for (org of organizations; track org._id) {
                    <option [value]="org._id">{{ org.name }}</option>
                  }
                </select>
              </div>
            }

            <!-- Branch list -->
            <div class="max-h-60 overflow-y-auto">
              @if (branches.length === 0) {
                <div class="py-6 text-center">
                  <p class="text-xs" [class]="darkMode ? 'text-slate-500' : 'text-gray-400'">
                    {{ selectedOrgId ? 'No branches found' : 'Select an organization first' }}
                  </p>
                </div>
              }
              @for (branch of branches; track branch._id) {
                <button (click)="onBranchChange(branch._id)"
                        class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        [class]="branch._id === selectedBranchId
                          ? (darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700')
                          : (darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-50 text-gray-700')">
                  <span class="w-2 h-2 rounded-full shrink-0"
                        [class]="branch._id === selectedBranchId ? 'bg-blue-500' : (darkMode ? 'bg-slate-600' : 'bg-gray-300')"></span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ branch.name }}</p>
                    @if (branch.isMain) {
                      <span class="text-xs px-1.5 py-0.5 rounded-full"
                            [class]="darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'">Main</span>
                    }
                  </div>
                  @if (branch._id === selectedBranchId) {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-blue-500">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                    </svg>
                  }
                </button>
              }
            </div>
          </div>
        }
      </div>
    } @else {
      <!-- Non-admin users just see their branch name -->
      @if (selectedBranchId) {
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg"
             [class]="darkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-gray-100 text-gray-600'">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"/>
          </svg>
          <span class="text-sm font-medium">{{ getCurrentBranchName() }}</span>
        </div>
      }
    }
  `,
})
export class BranchSwitcherComponent implements OnInit {
  @Input() darkMode = false;

  user: any;
  isSuperAdmin = false;
  isAdmin = false;

  organizations: any[] = [];
  branches: any[] = [];
  selectedOrgId: string | null = null;
  selectedBranchId: string | null = null;
  showDropdown = false;

  constructor(
    private authService: AuthService,
    private organizationService: OrganizationService,
    private branchService: BranchService,
    private orgContextService: OrgContextService,
  ) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    this.isSuperAdmin = this.user?.role === 'super_admin';
    this.isAdmin = this.user?.role === 'admin';
    this.initBranchSwitcher();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.branch-dropdown-container')) {
      this.showDropdown = false;
    }
  }

  private initBranchSwitcher() {
    this.selectedOrgId = this.orgContextService.organizationId || this.user?.organizationId?._id || this.user?.organizationId;
    this.selectedBranchId = this.orgContextService.branchId || this.user?.branchId?._id || this.user?.branchId;

    if (this.isSuperAdmin) {
      this.organizationService.getAll().subscribe({
        next: (orgs) => {
          this.organizations = orgs;
          if (this.selectedOrgId) {
            this.loadBranchesForOrg(this.selectedOrgId);
          }
        },
        error: () => {},
      });
    } else if (this.isAdmin && this.selectedOrgId) {
      this.loadBranchesForOrg(this.selectedOrgId);
    } else if (this.selectedOrgId) {
      // For regular users, just load branches to get the name
      this.loadBranchesForOrg(this.selectedOrgId);
    }
  }

  private loadBranchesForOrg(orgId: string) {
    this.branchService.getByOrganization(orgId).subscribe({
      next: (branches) => {
        this.branches = branches;
      },
      error: () => {},
    });
  }

  toggleDropdown() {
    if (!this.isSuperAdmin && !this.isAdmin) return;
    this.showDropdown = !this.showDropdown;
  }

  onOrgChange(orgId: string) {
    this.selectedOrgId = orgId;
    this.selectedBranchId = null;
    this.loadBranchesForOrg(orgId);
  }

  onBranchChange(branchId: string) {
    this.selectedBranchId = branchId;
    if (this.selectedOrgId && branchId) {
      this.orgContextService.setContext(this.selectedOrgId, branchId);
      this.showDropdown = false;
      window.location.reload();
    }
  }

  getCurrentBranchName(): string {
    const branch = this.branches.find(b => b._id === this.selectedBranchId);
    return branch?.name || 'Select Branch';
  }
}
