import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrgContextService } from './org-context.service';

@Injectable({ providedIn: 'root' })
export class DisciplineService {
  private get apiUrl(): string {
    return `${environment.apiUrl}${this.orgContext.getApiPrefix()}/discipline`;
  }

  constructor(private http: HttpClient, private orgContext: OrgContextService) {}

  getAll(
    classId?: string,
    studentId?: string,
    staffId?: string,
    subjectType?: string,
    incidentType?: string,
    severity?: string,
    resolved?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Observable<any[]> {
    const params: any = {};
    if (classId) params.classId = classId;
    if (studentId) params.studentId = studentId;
    if (staffId) params.staffId = staffId;
    if (subjectType) params.subjectType = subjectType;
    if (incidentType) params.incidentType = incidentType;
    if (severity) params.severity = severity;
    if (resolved !== undefined && resolved !== '') params.resolved = resolved;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getStudentHistory(studentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/student/${studentId}`);
  }

  getStaffHistory(staffId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/staff/${staffId}`);
  }

  getStats(classId?: string, subjectType?: string): Observable<any> {
    const params: any = {};
    if (classId) params.classId = classId;
    if (subjectType) params.subjectType = subjectType;
    return this.http.get<any>(`${this.apiUrl}/stats`, { params });
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
}
