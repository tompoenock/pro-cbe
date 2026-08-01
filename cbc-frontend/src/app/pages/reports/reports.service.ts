import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/api/reports`;

  constructor(private http: HttpClient) {}

  /**
   * Generate a student report
   */
  generateStudentReport(studentId: string, reportType?: string, startDate?: string, endDate?: string, teacherNotes?: string): Observable<any> {
    const data = {
      studentId,
      reportType: reportType || 'comprehensive',
      startDate,
      endDate,
      teacherNotes,
    };
    return this.http.post(`${this.apiUrl}/student`, data);
  }

  /**
   * Get all student reports
   */
  getAllStudentReports(studentId?: string, reportType?: string, page: number = 1, limit: number = 50): Observable<any> {
    let params = new HttpParams();
    if (studentId) params = params.set('studentId', studentId);
    if (reportType) params = params.set('reportType', reportType);
    params = params.set('page', page.toString());
    params = params.set('limit', Math.min(limit, 100).toString());

    return this.http.get(`${this.apiUrl}/student/all`, { params });
  }

  /**
   * Get reports for a specific student
   */
  getStudentReportsByStudentId(studentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/student/by-student/${studentId}`);
  }

  /**
   * Get a single student report
   */
  getStudentReport(reportId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/student/${reportId}`);
  }

  /**
   * Generate a school report
   */
  generateSchoolReport(startDate: string, endDate: string): Observable<any> {
    const data = { startDate, endDate };
    return this.http.post(`${this.apiUrl}/school`, data);
  }

  /**
   * Generate a per-pathway school report (scoped to a single registered pathway)
   */
  generatePathwayReport(pathwayId: string, startDate?: string, endDate?: string): Observable<any> {
    const data: any = { pathwayId };
    if (startDate) data.startDate = startDate;
    if (endDate) data.endDate = endDate;
    return this.http.post(`${this.apiUrl}/school/pathway`, data);
  }

  /**
   * Generate a class summary report (server-side)
   */
  generateClassSummary(classId: string, startDate?: string, endDate?: string): Observable<any> {
    const data: any = { classId };
    if (startDate) data.startDate = startDate;
    if (endDate) data.endDate = endDate;
    return this.http.post(`${this.apiUrl}/school/class`, data);
  }

  /**
   * Get all school reports
   */
  getAllSchoolReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/school/all`);
  }

  /**
   * Get a single school report
   */
  getSchoolReport(reportId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/school/${reportId}`);
  }

  /**
   * Get report analytics
   */
  getReportAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/summary`);
  }

  /**
   * Get a pathway report - grouped by pathway (and class if provided)
   * Route: GET /api/reports/pathway/report?classId=&pathwayId=&academicYear=&term=&limit=&page=
   */
  getPathwayReport(pathwayId?: string, classId?: string, academicYear?: string, term?: string): Observable<any> {
    let params = new HttpParams();
    if (pathwayId) params = params.set('pathwayId', pathwayId);
    if (classId) params = params.set('classId', classId);
    if (academicYear) params = params.set('academicYear', academicYear);
    if (term) params = params.set('term', term);
    return this.http.get(`${this.apiUrl}/pathway/report`, { params });
  }

  /**
   * Get a class pathway report - all pathways and their students in a class
   * Route: GET /api/reports/pathway/class/:classId?academicYear=&term=&limit=&page=
   */
  getClassPathwayReport(classId: string, academicYear?: string, term?: string): Observable<any> {
    let params = new HttpParams();
    if (academicYear) params = params.set('academicYear', academicYear);
    if (term) params = params.set('term', term);
    return this.http.get(`${this.apiUrl}/pathway/class/${classId}`, { params });
  }

  /**
   * Delete a report
   */
  deleteReport(reportId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${reportId}`);
  }
}
