import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../authentication/core/auth/auth.service';
import { ThemeService } from '../../shared/services/theme.service';
import { ClassService } from '../../shared/services/class.service';
import { StudentService } from '../../shared/services/student.service';
import { SubjectService } from '../../shared/services/subject.service';
import { StaffService } from '../../shared/services/staff.service';
import { ApprovalService } from '../../shared/services/approval.service';
import { ParentPortalService } from '../parent-portal/parent-portal.service';
import { PerformanceService } from '../../shared/services/performance.service';
import { ReportsService } from '../reports/reports.service';
import { forkJoin } from 'rxjs';
import { PathwaysService } from '../pathways/pathways.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule, RouterLink],
})
export class DashboardComponent implements OnInit {
  user: any;
  darkMode = false;
  stats = { classes: 0, students: 0, subjects: 0, staff: 0, pendingApprovals: 0 };
  // New richer dashboard data
  recentStudents: any[] = [];
  recentApprovals: any[] = [];
  topClasses: { name: string; count: number }[] = [];
  averageClassSize = 0;
  // Parent-specific
  children: any[] = [];
  childrenSummaries: any[] = [];
  parentChildrenCount = 0;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private classService: ClassService,
    private studentService: StudentService,
    private subjectService: SubjectService,
    private staffService: StaffService,
    private approvalService: ApprovalService,
    private pathwaysService: PathwaysService,
    private parentPortalService: ParentPortalService,
    private performanceService: PerformanceService,
    private reportsService: ReportsService,
  ) {}

  get isAdmin(): boolean {
    const role = this.user?.role;
    return role === 'admin' || role === 'super_admin';
  }

  get totalRecentReports(): number {
    return (this.childrenSummaries || []).reduce((acc, c) => acc + (c.recentReports || 0), 0);
  }

  get latestSampleGPA(): number | string {
    const item = (this.childrenSummaries || []).find((c) => c.latestGPA != null);
    return item ? item.latestGPA : 'N/A';
  }

  ngOnInit() {
    this.user = this.authService.getUser();
    this.themeService.darkMode$.subscribe(d => (this.darkMode = d));
    // If parent, load parent-specific summary and skip heavy dashboard loads
    if (this.user?.role === 'parent') {
      this.loadParentSummary();
      return;
    }
    this.classService.getCount().subscribe({ next: c => (this.stats.classes = c), error: () => {} });
    this.studentService.getCount().subscribe({ next: c => (this.stats.students = c), error: () => {} });
    this.subjectService.getCount().subscribe({ next: c => (this.stats.subjects = c), error: () => {} });
    this.staffService.getCount().subscribe({ next: c => (this.stats.staff = c), error: () => {} });
    this.approvalService.getPending().subscribe({ next: (data: any[]) => (this.stats.pendingApprovals = data.length), error: () => {} });

    // Load richer dashboard data in parallel
    forkJoin({
      classes: this.classService.getAll(),
      students: this.studentService.getAll(),
      approvals: this.approvalService.getAll({ limit: 10 }),
      pathways: this.pathwaysService.getAllPathways(undefined, 1, 100),
    }).subscribe({
      next: ({ classes, students, approvals }) => {
        // Recent students (assume returned sorted by createdAt desc)
        this.recentStudents = students.slice(0, 6);

        // Recent approvals
        this.recentApprovals = approvals.slice(0, 6);

        // Compute class sizes
        const classCounts: Record<string, number> = {};
        students.forEach((s: any) => {
          const cid = s.classId?._id || s.classId || 'unknown';
          classCounts[cid] = (classCounts[cid] || 0) + 1;
        });

        // Map class ids to names and sort
        const classMap: Record<string, string> = {};
        classes.forEach((c: any) => (classMap[c._id] = c.name));

        this.topClasses = Object.keys(classCounts)
          .map((id) => ({ name: classMap[id] || 'Unknown', count: classCounts[id] }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Average class size
        const classCountValues = Object.values(classCounts);
        this.averageClassSize = classCountValues.length ? Math.round(classCountValues.reduce((a, b) => a + b, 0) / classCountValues.length) : 0;
      },
      error: (err) => {
        console.error('Error loading dashboard details', err);
      },
    });
  }

  private loadParentSummary() {
    // Load children for the parent and then fetch a brief performance/report summary for each
    this.parentPortalService.getChildren().subscribe({
      next: (kids: any[]) => {
        this.children = kids || [];
        this.parentChildrenCount = this.children.length;
        // For each child, fetch latest performance (summary) and most recent report count
        this.childrenSummaries = [];
        for (const child of this.children) {
          const summary: any = {
            id: child._id,
            name: `${child.firstName} ${child.lastName}`,
            className: child.classId?.name || child.classId || 'N/A',
            latestGPA: null,
            recentReports: 0,
          };

          // performance report
          this.performanceService.getStudentReport(child._id, new Date().getFullYear().toString(), 'Term 1').subscribe({
            next: (perf: any) => {
              summary.latestGPA = perf?.overallGPA ?? null;
            },
            error: () => {
              summary.latestGPA = null;
            }
          });

          // reports count
          this.reportsService.getStudentReportsByStudentId(child._id).subscribe({
            next: (reports: any[]) => {
              summary.recentReports = (reports || []).length;
            },
            error: () => { summary.recentReports = 0; }
          });

          this.childrenSummaries.push(summary);
        }
      },
      error: (err) => {
        console.error('Failed to load parent children', err);
      }
    });
  }
}
