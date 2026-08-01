import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccessLogService {
  private apiUrl = `${environment.apiUrl}/api/auth/access-logs`;

  constructor(private http: HttpClient) {}

  getAll(params: { status?: string; search?: string; limit?: number } = {}): Observable<any[]> {
    const query: any = {};
    if (params.status) query.status = params.status;
    if (params.search) query.search = params.search;
    if (params.limit) query.limit = params.limit;
    return this.http.get<any[]>(this.apiUrl, { params: query });
  }
}
