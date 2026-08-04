import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../authentication/core/auth/auth.service';
import { ThemeService } from '../../shared/services/theme.service';
import { PermissionService } from '../../shared/services/permission.service';
import { NotificationService } from '../../shared/services/notification.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit, OnDestroy {
  user: any;
  sidebarOpen = true;
  darkMode = false;
  isSuperAdmin = false;
  showNotificationDropdown = false;
  unreadCount = 0;
  recentNotifications: any[] = [];
  showMaintenanceModal = false;
  maintenanceStatus: any = null;
  userRole = '';
  currentPermissions = new Set<string>();
  private notificationsSub: Subscription | null = null;

  // Each nav item may optionally declare a required permission key from SchoolPermission
  allNavItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: 'home', superAdminOnly: false, roles: ['parent'], permissionKey: 'VIEW_DASHBOARD' },
    { path: '/app/staff', label: 'Staff', icon: 'badge', superAdminOnly: false, permissionKey: 'VIEW_STAFF' },
    { path: '/app/users', label: 'Users', icon: 'people', roles: ['admin', 'super_admin'], permissionKey: 'VIEW_USERS' },
    { path: '/app/logs', label: 'Access Log', icon: 'history', roles: ['admin', 'super_admin'], permissionKey: 'VIEW_ACCESS_LOGS' },
    { path: '/app/classes', label: 'Classes', icon: 'school', superAdminOnly: false, permissionKey: 'VIEW_CLASSES' },
    { path: '/app/subjects', label: 'Subjects', icon: 'book', superAdminOnly: false, permissionKey: 'VIEW_SUBJECTS' },
    { path: '/app/students', label: 'Students', icon: 'people', superAdminOnly: false, permissionKey: 'VIEW_STUDENTS' },
    { path: '/app/grading', label: 'Grading', icon: 'grade', superAdminOnly: false, permissionKey: 'VIEW_GRADES' },
    { path: '/app/performance', label: 'Performance', icon: 'bar_chart', superAdminOnly: false, permissionKey: 'VIEW_PERFORMANCE' },
    
    // CBE Pathway modules
    { path: '/app/pathways', label: 'CBE Pathway', icon: 'trending_up', superAdminOnly: false, permissionKey: 'VIEW_CHILD_PATHWAY' },
    { path: '/app/reports', label: 'Reports', icon: 'assessment', superAdminOnly: false, roles: ['parent'], permissionKey: 'VIEW_REPORTS' },
    { path: '/app/parent-portal', label: 'Parent Portal', icon: 'family_restroom', roles: ['parent'], permissionKey: 'VIEW_CHILD_PERFORMANCE' },
  ];

  // Cross-module access map: allow a nav item to be visible if the user has any of the listed
  // alternate permissions. This supports the "cross module" access requirement.
  crossModuleAccess: Record<string, string[]> = {
    // allow access to Reports if user can view performance (useful when reports are generated from performance views)
    VIEW_REPORTS: ['VIEW_PERFORMANCE', 'GENERATE_REPORTS'],
    // allow pathways access if user can view performance or reports
    VIEW_CHILD_PATHWAY: ['VIEW_PERFORMANCE', 'VIEW_REPORTS'],
  };

  get navItems() {
    return this.allNavItems.filter((item: any) => {
      // Super admin always sees everything
      if (this.isSuperAdmin) return true;

      // Super-admin only flag
      if (item.superAdminOnly && !this.isSuperAdmin) return false;

      // Role-based access (if the item restricts by role)
      const roleAllowed = item.roles && item.roles.length > 0
        ? !!(this.userRole && item.roles.includes(this.userRole))
        : true;

      // Permission-based access (if the item declares a permission key)
      let permissionAllowed = true;
      if (item.permissionKey) {
        const key = item.permissionKey as string;
        permissionAllowed = this.permissionService.hasPermission(key)
          || (this.crossModuleAccess[key] || []).some((alt) => this.permissionService.hasPermission(alt));
      }

      // Role-restricted items: show when the role matches OR the permission is granted.
      // This lets users granted e.g. VIEW_REPORTS see the Reports item regardless of role.
      if (item.roles && item.roles.length > 0) {
        return roleAllowed || permissionAllowed;
      }

      // Non-role-restricted items: require the declared permission (or cross-module access).
      return permissionAllowed;
    });
  }

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private permissionService: PermissionService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    this.userRole = this.user?.role || this.authService.getUserRole() || '';
    this.isSuperAdmin = this.user?.role === 'super_admin';
    this.themeService.darkMode$.subscribe((isDark: boolean) => (this.darkMode = isDark));
    // load and subscribe to permission updates so the sidebar reacts in real-time
    this.permissionService.currentPermissions$.subscribe(perms => {
      this.currentPermissions = new Set(perms || []);
    });
    this.loadNotifications();
    // Poll for new notifications every 30 seconds
    this.notificationsSub = interval(30000).subscribe(() => this.loadNotifications());
  }

  ngOnDestroy() {
    this.notificationsSub?.unsubscribe();
  }

  loadNotifications() {
    this.notificationService.getUnreadCount().subscribe({
      next: (count: number) => (this.unreadCount = count),
      error: () => {},
    });
    this.notificationService.getAll(20).subscribe({
      next: (notifications: any[]) => (this.recentNotifications = notifications || []),
      error: () => {},
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.authService.logout();
  }

  toggleNotificationDropdown() {
    this.showNotificationDropdown = !this.showNotificationDropdown;
  }

  markAllNotificationsRead() {
    this.recentNotifications.forEach(n => n.read = true);
    this.unreadCount = 0;
    this.notificationService.markAllRead().subscribe({ error: () => {} });
  }

  markNotificationRead(notification: any) {
    if (!notification.read) {
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notificationService.markRead(notification._id).subscribe({ error: () => {} });
    }
  }

  getTimeAgo(date: string | Date): string {
    const now = new Date();
    const msgDate = new Date(date);
    const seconds = Math.floor((now.getTime() - msgDate.getTime()) / 1000);

    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [key, value] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / value);
      if (interval >= 1) {
        return interval === 1 ? `1 ${key} ago` : `${interval} ${key}s ago`;
      }
    }

    return 'just now';
  }

  dismissMaintenanceModal() {
    this.showMaintenanceModal = false;
  }
}
