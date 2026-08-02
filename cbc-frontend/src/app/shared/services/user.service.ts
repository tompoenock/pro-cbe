import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  getPending(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`, { params: { isApproved: 'false' } });
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin-register`, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${id}`);
  }

  approve(id: string, data?: { organizationId?: string; branchId?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/${id}/approve`, data || {});
  }

  reject(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${id}/reject`);
  }

  resetPassword(id: string, data: { newPassword: string; confirmPassword: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/${id}/reset-password`, data);
  }
  
  // Get IDs of currently active (online) users
  getActiveUserIds(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/active-users`);
  }
}
