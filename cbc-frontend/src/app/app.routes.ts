import { Routes } from '@angular/router';
import { AuthGuard } from './authentication/core/auth/auth.guard';
import { LoginComponent } from './authentication/login/login.component';
import { RegisterComponent } from './authentication/register/register.component';
import { ForgotPasswordComponent } from './authentication/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './authentication/reset-password/reset-password.component';
import { UpdatePasswordComponent } from './authentication/update-password/update-password.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClassesComponent } from './pages/classes/classes.component';
import { SubjectsComponent } from './pages/subjects/subjects.component';
import { StudentsComponent } from './pages/students/students.component';
import { GradingComponent } from './pages/grading/grading.component';
import { PerformanceComponent } from './pages/performance/performance.component';
import { StaffComponent } from './pages/staff/staff.component';
import { AccessLogComponent } from './pages/access-log/access-log.component';
import { PathwaysComponent } from './pages/pathways/pathways.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { ParentPortalComponent } from './pages/parent-portal/parent-portal.component';
import { UsersComponent } from './pages/users/users.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';

export const routes: Routes = [
  // Public routes
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'update-password', component: UpdatePasswordComponent },

  // Protected routes with layout
  {
    path: 'app',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['user', 'teacher', 'class_teacher', 'admin', 'super_admin', 'parent'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'staff', component: StaffComponent },
      { path: 'users', component: UsersComponent, data: { roles: ['admin', 'super_admin'] } },
      { path: 'logs', component: AccessLogComponent, data: { roles: ['admin', 'super_admin'] } },
      { path: 'classes', component: ClassesComponent },
      { path: 'subjects', component: SubjectsComponent },
      { path: 'students', component: StudentsComponent },
      { path: 'grading', component: GradingComponent },
      { path: 'performance', component: PerformanceComponent },
      { path: 'notifications', component: NotificationsComponent },

      // CBE Pathway modules
      { path: 'pathways', component: PathwaysComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'parent-portal', component: ParentPortalComponent, data: { roles: ['parent'] } },
    ],
  },

  // Legacy redirect
  { path: 'dashboard', redirectTo: '/app/dashboard', pathMatch: 'full' },

  // Catch-all
  { path: '**', redirectTo: '/login' },
];
