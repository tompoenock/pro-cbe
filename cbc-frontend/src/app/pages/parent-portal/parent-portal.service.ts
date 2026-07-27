import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ParentPortalService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Get student data accessible to parent
   */
  getChildren(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/students/by-parent`);
  }

  getStudentData(studentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/students/${studentId}`);
  }

  /**
   * Get student performance data
   */
  getStudentPerformance(studentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/report/student/${studentId}`);
  }

  /**
   * Get student's current assigned pathway
   */
  getStudentPathway(studentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/pathways/student/${studentId}`);
  }

  /**
   * Get student's pathway recommendations
   */
  getPathwayRecommendations(studentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/pathways/recommendations/${studentId}`);
  }

  /**
   * Get student reports
   */
  getStudentReports(studentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/student/by-student/${studentId}`);
  }

  /**
   * Send message to teacher (if supported)
   */
  sendMessageToTeacher(studentId: string, teacherId: string, message: string): Observable<any> {
    const data = { studentId, teacherId, message };
    return this.http.post(`${this.apiUrl}/messages`, data);
  }
}
