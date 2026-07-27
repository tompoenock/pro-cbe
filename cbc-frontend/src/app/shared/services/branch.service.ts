import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private apiUrl = `${environment.apiUrl}/api/organizations`;

  constructor(private http: HttpClient) {}

  getByOrganization(organizationId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${organizationId}/branches`);
  }

  getActive(organizationId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${organizationId}/branches/active`);
  }

  getMain(organizationId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${organizationId}/branches/main`);
  }

  getById(organizationId: string, branchId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${organizationId}/branches/${branchId}`);
  }

  create(organizationId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${organizationId}/branches`, data);
  }

  update(organizationId: string, branchId: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${organizationId}/branches/${branchId}`, data);
  }

  setMain(organizationId: string, branchId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${organizationId}/branches/${branchId}/set-main`, {});
  }

  updateStatus(organizationId: string, branchId: string, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${organizationId}/branches/${branchId}/status`, { status });
  }

  delete(organizationId: string, branchId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${organizationId}/branches/${branchId}`);
  }
}
