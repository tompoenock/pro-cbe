import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  private apiUrl = `${environment.apiUrl}/api/performance`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any[]> {
    const params: any = {};
    Object.keys(filters).forEach(key => {
      if (filters[key]) params[key] = filters[key];
    });
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  bulkCreate(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bulk`, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getStudentReport(studentId: string, academicYear: string, term: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/report/student/${studentId}`, {
      params: { academicYear, term },
    });
  }

  getClassReport(classId: string, academicYear: string, term: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/report/class/${classId}`, {
      params: { academicYear, term },
    });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  getWorkflowOverview(filters: any = {}): Observable<any> {
    const params: any = {};
    Object.keys(filters).forEach(key => {
      if (filters[key]) params[key] = filters[key];
    });
    return this.http.get<any>(`${this.apiUrl}/workflow-overview`, { params });
  }

  submitToClassTeacher(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/submit/class-teacher`, data);
  }

  submitToAdmin(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/submit/admin`, data);
  }

  approve(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/approve`, data);
  }

  returnMarks(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/return`, data);
  }
}
