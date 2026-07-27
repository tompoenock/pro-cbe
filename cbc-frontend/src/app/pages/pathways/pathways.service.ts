import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PathwaysService {
  private apiUrl = `${environment.apiUrl}/api/pathways`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new pathway (Admin/Teacher only)
   */
  createPathway(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  /**
   * Get all pathways with pagination
   */
  getAllPathways(search?: string, page: number = 1, limit: number = 50): Observable<any> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    params = params.set('page', page.toString());
    params = params.set('limit', Math.min(limit, 100).toString());

    return this.http.get(`${this.apiUrl}`, { params });
  }

  /**
   * Get all active pathways (for student selection)
   */
  getActivePathways(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/active/list`);
  }

  /**
   * Get a single pathway
   */
  getPathwayById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /**
   * Update a pathway
   */
  updatePathway(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete a pathway
   */
  deletePathway(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Assign pathway to a student
   */
  assignPathwayToStudent(pathwayId: string, studentId: string, notes?: string): Observable<any> {
    const data = { pathwayId, notes };
    return this.http.post(`${this.apiUrl}/${pathwayId}/assign/${studentId}`, data);
  }

  /**
   * Get student's current pathway
   */
  getStudentPathway(studentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/student/${studentId}`);
  }

  /**
   * Get students by pathway
   */
  getStudentsByPathway(pathwayId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${pathwayId}/students`);
  }

  /**
   * Approve student pathway
   */
  approveStudentPathway(studentPathwayId: string, notes?: string): Observable<any> {
    const data = { notes };
    return this.http.post(`${this.apiUrl}/student-pathway/${studentPathwayId}/approve`, data);
  }

  /**
   * Change student pathway
   */
  changeStudentPathway(studentId: string, newPathwayId: string, changeReason?: string, notes?: string): Observable<any> {
    const data = { newPathwayId, changeReason, notes };
    return this.http.patch(`${this.apiUrl}/student/${studentId}/change`, data);
  }

  /**
   * Get pathway distribution analytics
   */
  getPathwayDistribution(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/distribution`);
  }

  /**
   * Get pathway results tracking summary
   */
  getPathwayTracking(pathwayId: string, academicYear: string, term: string): Observable<any> {
    const params = new HttpParams()
      .set('academicYear', academicYear)
      .set('term', term);

    return this.http.get(`${this.apiUrl}/${pathwayId}/tracking`, { params });
  }

  /**
   * Get all students
   */
  getAllStudents(page: number = 1, limit: number = 100): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', Math.min(limit, 100).toString());

    return this.http.get(`${environment.apiUrl}/api/students`, { params });
  }

  /**
   * Assign multiple students to a pathway
   */
  assignStudentsToPathway(pathwayId: string, studentIds: string[]): Observable<any> {
    const data = { studentIds };
    return this.http.post(`${this.apiUrl}/${pathwayId}/assign-multiple`, data);
  }

  /**
   * Calculate student's GPA based on performance
   */
  calculateStudentGPA(studentId: string, academicYear?: string, term?: string): Observable<any> {
    let params = new HttpParams();
    if (academicYear) params = params.set('academicYear', academicYear);
    if (term) params = params.set('term', term);

    return this.http.get(`${this.apiUrl}/gpa/${studentId}`, { params });
  }

  /**
   * Get pathway recommendations grouped by subject performance
   */
  getPathwayRecommendations(studentId: string, academicYear?: string, term?: string): Observable<any> {
    let params = new HttpParams();
    if (academicYear) params = params.set('academicYear', academicYear);
    if (term) params = params.set('term', term);

    return this.http.get(`${this.apiUrl}/recommendations/${studentId}`, { params });
  }

  /**
   * Auto-place student in best pathway based on performance and GPA
   */
  autoPlaceStudent(studentId: string, academicYear?: string, term?: string): Observable<any> {
    let params = new HttpParams();
    if (academicYear) params = params.set('academicYear', academicYear);
    if (term) params = params.set('term', term);

    return this.http.post(`${this.apiUrl}/auto-place/${studentId}`, {}, { params });
  }
}
