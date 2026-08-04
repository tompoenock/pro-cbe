import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../shared/services/theme.service';
import { AccessLogService } from '../../shared/services/access-log.service';

@Component({
  selector: 'app-access-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './access-log.component.html',
  styleUrls: ['./access-log.component.css'],
})
export class AccessLogComponent implements OnInit {
  darkMode = false;
  logs: any[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  filterStatus = '';
  limit = 100;

  constructor(
    private themeService: ThemeService,
    private accessLogService: AccessLogService,
  ) {}

  ngOnInit() {
    this.themeService.darkMode$.subscribe((d: boolean) => (this.darkMode = d));
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    this.error = '';
    this.accessLogService.getAll({
      status: this.filterStatus || undefined,
      search: this.searchTerm || undefined,
      limit: this.limit,
    }).subscribe({
      next: (data: any[]) => { this.logs = data || []; this.loading = false; },
      error: (err: any) => { this.error = err.error?.message || 'Failed to load access logs'; this.loading = false; },
    });
  }

  resetFilters() {
    this.searchTerm = '';
    this.filterStatus = '';
    this.limit = 100;
    this.loadLogs();
  }

  get totalCount(): number { return this.logs.length; }
  get successCount(): number { return this.logs.filter(l => l.status === 'success').length; }
  get failedCount(): number { return this.logs.filter(l => l.status === 'failed').length; }
  get activeCount(): number { return this.logs.filter(l => l.status === 'success' && !l.logoutAt).length; }

  getStatusBadgeClasses(status: string): string {
    if (status === 'success') return 'bg-emerald-100 text-emerald-700';
    return 'bg-red-100 text-red-700';
  }

  getRoleBadgeClasses(role: string): string {
    const base = 'px-2 py-0.5 rounded text-xs font-medium';
    switch (role) {
      case 'super_admin': return `${base} bg-purple-100 text-purple-700`;
      case 'admin': return `${base} bg-blue-100 text-blue-700`;
      case 'teacher': return `${base} bg-amber-100 text-amber-700`;
      case 'class_teacher': return `${base} bg-orange-100 text-orange-700`;
      case 'parent': return `${base} bg-teal-100 text-teal-700`;
      case 'student': return `${base} bg-pink-100 text-pink-700`;
      default: return `${base} bg-gray-100 text-gray-700`;
    }
  }

  formatDate(value: string | Date): string {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  }

  getDuration(entry: any): string {
    if (!entry.loginAt) return '-';
    const end = entry.logoutAt ? new Date(entry.logoutAt) : new Date();
    const start = new Date(entry.loginAt);
    const seconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    return `${hours}h ${remMin}m`;
  }

  getBrowser(ua: string): string {
    if (!ua || ua === 'unknown') return '-';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/')) return 'Safari';
    if (ua.includes('PostmanRuntime')) return 'Postman';
    return ua.substring(0, 40);
  }
}
