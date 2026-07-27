import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum SchoolPermission {
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  VIEW_USERS = 'VIEW_USERS',
  CREATE_USER = 'CREATE_USER',
  EDIT_USER = 'EDIT_USER',
  DELETE_USER = 'DELETE_USER',
  APPROVE_USER = 'APPROVE_USER',
  MANAGE_USER_PERMISSIONS = 'MANAGE_USER_PERMISSIONS',
  RESET_USER_PASSWORD = 'RESET_USER_PASSWORD',
  VIEW_STAFF = 'VIEW_STAFF',
  CREATE_STAFF = 'CREATE_STAFF',
  EDIT_STAFF = 'EDIT_STAFF',
  DELETE_STAFF = 'DELETE_STAFF',
  VIEW_CLASSES = 'VIEW_CLASSES',
  CREATE_CLASS = 'CREATE_CLASS',
  EDIT_CLASS = 'EDIT_CLASS',
  DELETE_CLASS = 'DELETE_CLASS',
  VIEW_SUBJECTS = 'VIEW_SUBJECTS',
  CREATE_SUBJECT = 'CREATE_SUBJECT',
  EDIT_SUBJECT = 'EDIT_SUBJECT',
  DELETE_SUBJECT = 'DELETE_SUBJECT',
  VIEW_STUDENTS = 'VIEW_STUDENTS',
  CREATE_STUDENT = 'CREATE_STUDENT',
  EDIT_STUDENT = 'EDIT_STUDENT',
  DELETE_STUDENT = 'DELETE_STUDENT',
  
  VIEW_GRADES = 'VIEW_GRADES',
  CREATE_GRADE = 'CREATE_GRADE',
  EDIT_GRADE = 'EDIT_GRADE',
  DELETE_GRADE = 'DELETE_GRADE',
  VIEW_PERFORMANCE = 'VIEW_PERFORMANCE',
  GENERATE_REPORTS = 'GENERATE_REPORTS',
  VIEW_REPORTS = 'VIEW_REPORTS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  // Parent Portal
  VIEW_CHILD_PERFORMANCE = 'VIEW_CHILD_PERFORMANCE',
  VIEW_CHILD_PATHWAY = 'VIEW_CHILD_PATHWAY',
  VIEW_CHILD_REPORTS = 'VIEW_CHILD_REPORTS',
  VIEW_CHILD_ATTENDANCE = 'VIEW_CHILD_ATTENDANCE',
  RECEIVE_NOTIFICATIONS = 'RECEIVE_NOTIFICATIONS',
  MESSAGE_TEACHER = 'MESSAGE_TEACHER',
}

export interface PermissionGroup {
  name: string;
  icon: string;
  permissions: { key: SchoolPermission; label: string }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Dashboard',
    icon: '📊',
    permissions: [
      { key: SchoolPermission.VIEW_DASHBOARD, label: 'View Dashboard' },
    ],
  },
  {
    name: 'User Management',
    icon: '👤',
    permissions: [
      { key: SchoolPermission.VIEW_USERS, label: 'View Users' },
      { key: SchoolPermission.CREATE_USER, label: 'Create User' },
      { key: SchoolPermission.EDIT_USER, label: 'Edit User' },
      { key: SchoolPermission.DELETE_USER, label: 'Delete User' },
      { key: SchoolPermission.APPROVE_USER, label: 'Approve User' },
      { key: SchoolPermission.MANAGE_USER_PERMISSIONS, label: 'Manage Permissions' },
      { key: SchoolPermission.RESET_USER_PASSWORD, label: 'Reset User Password' },
    ],
  },
  {
    name: 'Staff',
    icon: '🪪',
    permissions: [
      { key: SchoolPermission.VIEW_STAFF, label: 'View Staff' },
      { key: SchoolPermission.CREATE_STAFF, label: 'Create Staff' },
      { key: SchoolPermission.EDIT_STAFF, label: 'Edit Staff' },
      { key: SchoolPermission.DELETE_STAFF, label: 'Delete Staff' },
    ],
  },
  {
    name: 'Classes',
    icon: '🏫',
    permissions: [
      { key: SchoolPermission.VIEW_CLASSES, label: 'View Classes' },
      { key: SchoolPermission.CREATE_CLASS, label: 'Create Class' },
      { key: SchoolPermission.EDIT_CLASS, label: 'Edit Class' },
      { key: SchoolPermission.DELETE_CLASS, label: 'Delete Class' },
    ],
  },
  {
    name: 'Subjects',
    icon: '📚',
    permissions: [
      { key: SchoolPermission.VIEW_SUBJECTS, label: 'View Subjects' },
      { key: SchoolPermission.CREATE_SUBJECT, label: 'Create Subject' },
      { key: SchoolPermission.EDIT_SUBJECT, label: 'Edit Subject' },
      { key: SchoolPermission.DELETE_SUBJECT, label: 'Delete Subject' },
    ],
  },
  {
    name: 'Students',
    icon: '🎓',
    permissions: [
      { key: SchoolPermission.VIEW_STUDENTS, label: 'View Students' },
      { key: SchoolPermission.CREATE_STUDENT, label: 'Create Student' },
      { key: SchoolPermission.EDIT_STUDENT, label: 'Edit Student' },
      { key: SchoolPermission.DELETE_STUDENT, label: 'Delete Student' },
    ],
  },
  {
    name: 'Grading',
    icon: '⭐',
    permissions: [
      { key: SchoolPermission.VIEW_GRADES, label: 'View Grades' },
      { key: SchoolPermission.CREATE_GRADE, label: 'Create Grade' },
      { key: SchoolPermission.EDIT_GRADE, label: 'Edit Grade' },
      { key: SchoolPermission.DELETE_GRADE, label: 'Delete Grade' },
    ],
  },
  {
    name: 'Performance',
    icon: '📈',
    permissions: [
      { key: SchoolPermission.VIEW_PERFORMANCE, label: 'View Performance' },
      { key: SchoolPermission.GENERATE_REPORTS, label: 'Generate Reports' },
    ],
  },
  {
    name: 'Pathways',
    icon: '🧭',
    permissions: [
      { key: SchoolPermission.VIEW_CHILD_PATHWAY, label: 'View Pathways' },
    ],
  },
  {
    name: 'Parent Portal',
    icon: '👪',
    permissions: [
      { key: SchoolPermission.VIEW_CHILD_PERFORMANCE, label: 'View Child Performance' },
      { key: SchoolPermission.VIEW_CHILD_REPORTS, label: 'View Child Reports' },
      { key: SchoolPermission.VIEW_CHILD_ATTENDANCE, label: 'View Child Attendance' },
      { key: SchoolPermission.RECEIVE_NOTIFICATIONS, label: 'Receive Notifications' },
      { key: SchoolPermission.MESSAGE_TEACHER, label: 'Message Teacher' },
    ],
  },
  {
    name: 'Reports',
    icon: '📄',
    permissions: [
      { key: SchoolPermission.VIEW_REPORTS, label: 'View Reports' },
      { key: SchoolPermission.EXPORT_REPORTS, label: 'Export Reports' },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private apiUrl = `${environment.apiUrl}/api/auth/permissions`;
  private _currentPermissions$ = new BehaviorSubject<string[]>([]);
  currentPermissions$ = this._currentPermissions$.asObservable();

  constructor(private http: HttpClient) {}

  getUserPermissions(userId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${userId}`);
  }

  updateUserPermissions(userId: string, permissions: string[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}`, { permissions });
  }

  getMyPermissions(): Observable<{ permissions: string[]; role: string }> {
    return this.http.get<{ permissions: string[]; role: string }>(`${this.apiUrl}/me`);
  }

  loadCurrentUserPermissions(): void {
    this.getMyPermissions().subscribe({
      next: (res) => this._currentPermissions$.next(res.permissions),
    });
  }

  hasPermission(permission: string): boolean {
    return this._currentPermissions$.value.includes(permission);
  }

  clearCurrentPermissions(): void {
    this._currentPermissions$.next([]);
  }

  getPermissionGroups(): PermissionGroup[] {
    return PERMISSION_GROUPS;
  }
}
