import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../shared/services/theme.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit {
  darkMode = false;
  notifications: any[] = [];
  loading = false;
  error = '';
  filter = '';

  constructor(
    private themeService: ThemeService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.themeService.darkMode$.subscribe((d: boolean) => (this.darkMode = d));
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading = true;
    this.error = '';
    this.notificationService.getAll(100).subscribe({
      next: (data: any[]) => { this.notifications = data || []; this.loading = false; },
      error: (err: any) => { this.error = err.error?.message || 'Failed to load notifications'; this.loading = false; },
    });
  }

  get filteredNotifications(): any[] {
    if (!this.filter) return this.notifications;
    return this.notifications.filter(n =>
      (n.title || '').toLowerCase().includes(this.filter.toLowerCase()) ||
      (n.message || '').toLowerCase().includes(this.filter.toLowerCase())
    );
  }

  markRead(n: any) {
    if (!n.read) {
      n.read = true;
      this.notificationService.markRead(n._id).subscribe({ error: () => {} });
    }
  }

  markAllRead() {
    this.notifications.forEach(n => n.read = true);
    this.notificationService.markAllRead().subscribe({ error: () => {} });
  }

  get unreadCount(): number { return this.notifications.filter(n => !n.read).length; }

  getTypeBadgeClasses(type: string | undefined): string {
    const base = 'px-2 py-0.5 rounded text-xs font-medium';
    switch (type) {
      case 'performance_submitted': return `${base} bg-blue-100 text-blue-700`;
      case 'performance_pending_admin': return `${base} bg-orange-100 text-orange-700`;
      case 'performance_approved': return `${base} bg-emerald-100 text-emerald-700`;
      case 'performance_returned': return `${base} bg-red-100 text-red-700`;
      default: return `${base} bg-gray-100 text-gray-700`;
    }
  }

  getTypeLabel(type: string | undefined): string {
    const labels: Record<string, string> = {
      performance_submitted: 'Submitted for Review',
      performance_pending_admin: 'Pending Admin Approval',
      performance_approved: 'Approved',
      performance_returned: 'Returned for Correction',
    };
    return labels[type || ''] || type || 'Notification';
  }

  formatDate(value: string | Date): string {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  }
}
