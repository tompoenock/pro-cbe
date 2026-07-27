import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrgContextService } from './org-context.service';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private get apiUrl(): string {
    return `${environment.apiUrl}${this.orgContext.getApiPrefix()}/attendance`;
  }

  constructor(private http: HttpClient, private orgContext: OrgContextService) {}

  takeAttendance(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  getAll(classId?: string, date?: string, dateFrom?: string, dateTo?: string): Observable<any[]> {
    const params: any = {};
    if (classId) params.classId = classId;
    if (date) params.date = date;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getStudentAttendance(studentId: string, dateFrom?: string, dateTo?: string): Observable<any[]> {
    const params: any = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return this.http.get<any[]>(`${this.apiUrl}/student/${studentId}`, { params });
  }

  getClassSummary(classId: string, dateFrom?: string, dateTo?: string): Observable<any> {
    const params: any = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return this.http.get<any>(`${this.apiUrl}/summary/${classId}`, { params });
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
