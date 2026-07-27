import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrgContextService } from './org-context.service';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private get apiUrl(): string {
    return `${environment.apiUrl}${this.orgContext.getApiPrefix()}/staff`;
  }

  constructor(private http: HttpClient, private orgContext: OrgContextService) {}

  getAll(staffType?: string, search?: string): Observable<any[]> {
    const params: any = {};
    if (staffType) params.staffType = staffType;
    if (search) params.search = search;
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getTeachers(): Observable<any[]> {
    // Use organization-scoped staff teachers endpoint so returned records include staff->user info
      // Use auth users endpoint to return User records with role 'teacher'
      return this.http.get<any[]>(`${environment.apiUrl}/api/auth/teachers`);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }
}
