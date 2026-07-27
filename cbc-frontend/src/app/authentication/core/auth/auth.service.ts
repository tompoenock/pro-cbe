import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { Role } from '../../../shared/models/roles.enum';
import { OrgContextService } from '../../../shared/services/org-context.service';
import { PermissionService } from '../../../shared/services/permission.service';

interface LoginResponse {
  user: any;
  access_token: string;
  requirePasswordChange?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserRole = new BehaviorSubject<string | null>(null);
  private authState = new BehaviorSubject<boolean>(false);
  public authState$ = this.authState.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private orgContext: OrgContextService,
    private permissionService: PermissionService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.authState.next(this.hasValidToken());

      const user = localStorage.getItem('user');
      const parsedUser = user ? JSON.parse(user) : null;
      const role = parsedUser?.role || this.getUserRole();
      this.currentUserRole.next(role);

      if (parsedUser?.organizationId && parsedUser?.branchId) {
        this.orgContext.setContext(parsedUser.organizationId, parsedUser.branchId);
      }
    }
  }

  // ─── REGISTER ────────────────────────────────────────────────

  register(credentials: {
    username: string;
    email: string;
    phone_no: string;
    password: string;
    role?: Role;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, credentials);
  }

  // ─── LOGIN ───────────────────────────────────────────────────

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: LoginResponse) => {
        this.setToken(res.access_token);
        this.setUser(res.user);
        this.permissionService.loadCurrentUserPermissions();
        this.authState.next(true);
      }),
    );
  }

  // ─── PASSWORD MANAGEMENT ────────────────────────────────────

  updatePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/update-password`, data);
  }

  firstTimePasswordChange(data: { newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/first-time-password-change`, data);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(data: { token: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  // ─── LOGOUT ──────────────────────────────────────────────────

  logout(): void {
    if (isPlatformBrowser(this.platformId) && this.hasValidToken()) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ error: () => {} });
    }

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('requirePasswordChange');
    }

    this.permissionService.clearCurrentPermissions();
    this.currentUserRole.next(null);
    this.authState.next(false);
    this.orgContext.clearContext();
    this.router.navigate(['/login']);
  }

  // ─── TOKEN & USER ───────────────────────────────────────────

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('access_token');
  }

  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('access_token', token);
    }

    const decoded = this.decodeToken(token);
    this.currentUserRole.next(decoded?.role ?? null);
    this.authState.next(true);

    if (decoded?.email) {
      const existingUser = this.getUser();
      const userInfo = {
        _id: decoded.sub || existingUser?._id || null,
        username: decoded.username || existingUser?.username || '',
        email: decoded.email,
        role: decoded.role || Role.User,
        phone_no: existingUser?.phone_no || null,
        organizationId: decoded.organizationId || existingUser?.organizationId || null,
        branchId: decoded.branchId || existingUser?.branchId || null,
      };
      this.setUser(userInfo);
    }
  }

  setUser(user: any): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    this.currentUserRole.next(user?.role ?? null);
    this.authState.next(true);

    if (user?.organizationId && user?.branchId) {
      this.orgContext.setContext(user.organizationId, user.branchId);
    }
  }

  getUser(): any {
    if (!isPlatformBrowser(this.platformId)) return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getUserRole(): string | null {
    const user = this.getUser();
    if (user?.role) return user.role;

    const token = this.getToken();
    if (!token) return null;
    return this.decodeToken(token)?.role ?? null;
  }

  getUsername(): string | null {
    const user = this.getUser();
    return user?.username ?? null;
  }

  getRoleStream(): Observable<string | null> {
    return this.currentUserRole.asObservable();
  }

  // ─── PRIVATE HELPERS ─────────────────────────────────────────

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp > now;
  }
}
