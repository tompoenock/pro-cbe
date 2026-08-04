import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/api/notifications`;

  constructor(private http: HttpClient) {}

  getAll(limit = 30): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { params: { limit: String(limit) } });
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`);
  }

  markRead(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/read/${id}`, {});
  }

  markAllRead(): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/read-all`, {});
  }
}
