import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, concatMap, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private apiUrl = `${environment.apiUrl}/api/students`;

  constructor(private http: HttpClient) {}

  getAll(classId?: string, search?: string): Observable<any[]> {
    const params: any = {};
    if (classId) params.classId = classId;
    if (search) params.search = search;
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getByClass(classId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/by-class/${classId}`);
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

  getCount(classId?: string): Observable<number> {
    const params: any = {};
    if (classId) params.classId = classId;
    return this.http.get<number>(`${this.apiUrl}/count`, { params });
  }

  // Get students in a class taking a specific subject
  getByClassAndSubject(classId: string, subjectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/class/${classId}/subject/${subjectId}`);
  }

  // ===== Student-Subject Assignment Methods =====

  /**
   * Assign subjects to a student
   */
  assignSubjects(studentId: string, classId: string, academicYear: string, subjectIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/subjects/assign`, {
      studentId,
      classId,
      academicYear,
      subjectIds,
    });
  }

  /**
   * Get student's enrolled subjects
   */
  getStudentSubjects(studentId: string, classId: string, academicYear: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${studentId}/subjects`, {
      params: { classId, academicYear },
    });
  }

  /**
   * Get all student-subject enrollments for a class
   */
  getClassStudentSubjects(classId: string, academicYear: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/class/${classId}/subjects`, {
      params: { academicYear },
    });
  }

  /**
   * Query student subjects with filters
   */
  queryStudentSubjects(filters: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/subjects/query`, { params: filters });
  }

  /**
   * Remove student from subject
   */
  removeFromSubject(studentSubjectId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/subjects/${studentSubjectId}`);
  }

  /**
   * Update student subject enrollment status
   */
  updateSubjectStatus(studentSubjectId: string, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/subjects/${studentSubjectId}/status`, null, {
      params: { status },
    });
  }

  /**
   * Assign multiple students to a single subject
   * Calls assignSubjects for each student sequentially
   */
  assignStudentsToSubject(
    studentIds: string[],
    classId: string,
    academicYear: string,
    subjectId: string
  ): Observable<any> {
    if (studentIds.length === 0) {
      return of({ success: true, message: 'No students to assign' });
    }
    
    // Create an observable that sequentially assigns each student to the subject
    return from(studentIds).pipe(
      concatMap(studentId =>
        this.assignSubjects(studentId, classId, academicYear, [subjectId])
      )
    );
  }
}
