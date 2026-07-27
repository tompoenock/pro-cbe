import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrgContextService } from './org-context.service';

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private get apiUrl(): string {
    return `${environment.apiUrl}${this.orgContext.getApiPrefix()}/approvals`;
  }

  constructor(private http: HttpClient, private orgContext: OrgContextService) {}

  getAll(filters: any = {}): Observable<any[]> {
    const params: any = {};
    Object.keys(filters).forEach(key => { if (filters[key]) params[key] = filters[key]; });
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getPending(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending`);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  processStep(id: string, data: { action: string; comment?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/process`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
