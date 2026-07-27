import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private apiUrl = `${environment.apiUrl}/api/subjects`;

  constructor(private http: HttpClient) {}

  getAll(classId?: string): Observable<any[]> {
    const params: any = {};
    if (classId) params.classId = classId;
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

  seedCBESubjects(classId?: string, category?: string): Observable<{ classesProcessed: number; subjectsUpserted: number }> {
    return this.http.post<{ classesProcessed: number; subjectsUpserted: number }>(`${this.apiUrl}/seed-CBE`, {
      classId: classId || undefined,
      category: category || undefined,
    });
  }

  getCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }
}
