import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrgContextService } from './org-context.service';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private get apiUrl(): string {
    return `${environment.apiUrl}${this.orgContext.getApiPrefix()}/payments`;
  }

  constructor(private http: HttpClient, private orgContext: OrgContextService) {}

  getAll(filters: any = {}): Observable<any[]> {
    const params: any = {};
    Object.keys(filters).forEach(key => { if (filters[key]) params[key] = filters[key]; });
    return this.http.get<any[]>(this.apiUrl, { params });
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

  getBalance(studentId: string, academicYear: string, term: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/balance/${studentId}`, { params: { academicYear, term } });
  }

  // Fee Structure
  getAllFees(academicYear?: string, term?: string): Observable<any[]> {
    const params: any = {};
    if (academicYear) params.academicYear = academicYear;
    if (term) params.term = term;
    return this.http.get<any[]>(`${this.apiUrl}/fees/all`, { params });
  }

  createFee(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/fees`, data);
  }

  updateFee(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/fees/${id}`, data);
  }

  deleteFee(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/fees/${id}`);
  }
}
