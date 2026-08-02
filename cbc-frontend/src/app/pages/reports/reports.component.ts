import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import { ReportsService } from './reports.service';
import { AuthService } from '../../authentication/core/auth/auth.service';
import { ParentPortalService } from '../parent-portal/parent-portal.service';
import { ClassService } from '../../shared/services/class.service';
import { StudentService } from '../../shared/services/student.service';
import { PathwaysService } from '../pathways/pathways.service';
import { ThemeService } from '../../shared/services/theme.service';
import { PermissionService, SchoolPermission } from '../../shared/services/permission.service';
import { forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxChartsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  selectedReportType: 'student' | 'school' = 'student';
  studentReports: any[] = [];
  schoolReports: any[] = [];
  children: any[] = [];
  selectedChildId: string = 'all';
  selectedReportTypeFilter: string = 'all';
  reportAnalytics: any = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  isTeacher = false;
  isAdmin = false;
  isParent = false;
  darkMode = false;
  classes: any[] = [];

  subjectScoresColorScheme: Color = { name: 'subjectScores', selectable: true, group: ScaleType.Ordinal, domain: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9'] };
  termTrendsColorScheme: Color = { name: 'termTrends', selectable: true, group: ScaleType.Ordinal, domain: ['#06b6d4', '#22c55e', '#f97316', '#a855f7', '#0ea5e9'] };

  // Per-pathway report state
  pathways: any[] = [];
  selectedPathwayId: string = '';
  pathwayReport: any = null;
  pathwayReportLoading = false;

  // Per-pathway report generation state
  pathwayGenStartDate: string = this.yearStart();
  pathwayGenEndDate: string = this.today();
  generatingPathwayIds: Set<string> = new Set();
  generatingAllPathways = false;

  // School / class report generation state
  schoolReportScope: 'entire' | 'class' = 'entire';
  schoolGenClassId: string = '';
  generatingSchoolReport = false;
  generatingClassReport = false;

  // Pagination
  pageSize = 12;
  studentPage = 1;
  schoolPage = 1;
  pathwayPage = 1;

  onStudentFilterChange(): void {
    this.studentPage = 1;
  }

  get paginatedStudentReports(): any[] {
    const list = this.filteredStudentReports();
    const start = (this.studentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get studentPageCount(): number {
    return Math.max(1, Math.ceil(this.filteredStudentReports().length / this.pageSize));
  }

  get studentPages(): number[] {
    return Array.from({ length: this.studentPageCount }, (_, i) => i + 1);
  }

  goToStudentPage(page: number): void {
    if (page >= 1 && page <= this.studentPageCount) {
      this.studentPage = page;
    }
  }

  get paginatedSchoolReports(): any[] {
    const list = this.schoolReports || [];
    const start = (this.schoolPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get schoolPageCount(): number {
    return Math.max(1, Math.ceil((this.schoolReports || []).length / this.pageSize));
  }

  get schoolPages(): number[] {
    return Array.from({ length: this.schoolPageCount }, (_, i) => i + 1);
  }

  goToSchoolPage(page: number): void {
    if (page >= 1 && page <= this.schoolPageCount) {
      this.schoolPage = page;
    }
  }

  get paginatedPathways(): any[] {
    const list = this.pathways || [];
    const start = (this.pathwayPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get pathwayPageCount(): number {
    return Math.max(1, Math.ceil((this.pathways || []).length / this.pageSize));
  }

  get pathwayPages(): number[] {
    return Array.from({ length: this.pathwayPageCount }, (_, i) => i + 1);
  }

  goToPathwayPage(page: number): void {
    if (page >= 1 && page <= this.pathwayPageCount) {
      this.pathwayPage = page;
    }
  }

  getReportInitials(report: any): string {
    const first = report?.studentId?.firstName || '';
    const last = report?.studentId?.lastName || '';
    return `${(first[0] || '').toUpperCase()}${(last[0] || '').toUpperCase()}` || '?';
  }

  getReportTitleInitials(report: any): string {
    const title = this.getPathwayReportTitle(report).replace(/^Pathway Report:\s*/i, '');
    return title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || '?';
  }

  // Modal states
  showGenerateModal = false;
  showViewModal = false;
  isSubmitting = false;
  viewLoading = false;
  selectedReport: any = null;
  selectedReportPathwayNames: string[] = [];
  selectedReportPathwayDistribution: any = null;
  selectedReportPerformanceData: any[] = [];
  sortedPathwayEntries: any[] = [];
  generateReportForm = {
    studentId: '',
    classId: '',
    reportType: 'pathway',
    startDate: '',
    endDate: '',
  };

  constructor(
    private reportsService: ReportsService,
    private authService: AuthService,
    private parentPortalService: ParentPortalService,
    private classService: ClassService,
    private studentService: StudentService,
    private pathwaysService: PathwaysService,
    private themeService: ThemeService,
    private permissionService: PermissionService,
  ) {
    const role = this.authService.getUserRole() || localStorage.getItem('role') || sessionStorage.getItem('userRole') || '';
    this.isTeacher = role === 'teacher' || role === 'admin' || role === 'super_admin' ? role === 'teacher' : false;
    this.isAdmin = role === 'admin' || role === 'super_admin';
    this.isParent = role === 'parent';
  }

  filteredStudentReports(): any[] {
    let list = this.studentReports || [];
    if (this.selectedChildId && this.selectedChildId !== 'all') {
      list = list.filter(r => r.studentId?._id === this.selectedChildId);
    }
    if (this.selectedReportTypeFilter && this.selectedReportTypeFilter !== 'all') {
      list = list.filter(r => (r.reportType || '').toLowerCase() === this.selectedReportTypeFilter.toLowerCase());
    }
    return list;
  }

  ngOnInit(): void {
    this.themeService.darkMode$.subscribe((d: boolean) => (this.darkMode = d));
    // Default report type depends on role
    if (this.isParent) {
      this.loadStudentReportsForParent();
      this.selectedReportType = 'student';
    } else {
      // Teachers only get pathway reports (school section), not individual student reports
      if (this.isTeacher && !this.isAdmin) {
        this.selectedReportType = 'school';
        this.schoolReportScope = 'class';
      } else {
        this.loadStudentReports();
      }
      // Load available classes for teachers/admins to allow class-based report generation
      if (this.isAdmin || this.isTeacher) {
        this.loadClasses();
      }
      if (this.isAdmin || this.isTeacher) {
        this.loadSchoolReports();
      }
      if (this.isAdmin) {
        this.loadAnalytics();
        this.selectedReportType = 'school';
      }
      if (this.isAdmin || this.isTeacher) {
        this.loadPathways();
      }
    }
  }

  loadPathways(): void {
    this.pathwaysService.getAllPathways(undefined, 1, 100).subscribe({
      next: (data: any) => {
        this.pathways = (data?.data || data || []).filter((p: any) => !p.isDeleted);
        if (this.pathways.length === 0) {
          this.pathwaysService.getActivePathways().subscribe({
            next: (active: any[]) => {
              this.pathways = active || [];
            },
            error: (err) => {
              console.error('Failed to load active pathways', err);
            },
          });
        }
      },
      error: (err) => {
        console.error('Failed to load pathways for reports', err);
        this.pathwaysService.getActivePathways().subscribe({
          next: (active: any[]) => {
            this.pathways = active || [];
          },
          error: (err2) => {
            console.error('Failed to load active pathways', err2);
          },
        });
      },
    });
  }

  yearStart(): string {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
  }

  today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  generateWholeSchoolReport(): void {
    if (!this.pathwayGenStartDate || !this.pathwayGenEndDate) {
      this.error = 'Please select a start and end date.';
      return;
    }
    this.error = null;
    this.success = null;
    this.generatingSchoolReport = true;
    this.reportsService.generateSchoolReport(this.pathwayGenStartDate, this.pathwayGenEndDate).subscribe({
      next: () => {
        this.generatingSchoolReport = false;
        this.success = 'School report generated successfully!';
        this.loadSchoolReports();
        setTimeout(() => (this.success = null), 4000);
      },
      error: (err) => {
        this.generatingSchoolReport = false;
        this.error = err.error?.message || 'Failed to generate school report';
        console.error('Error generating school report:', err);
      },
    });
  }

  generateClassSummary(): void {
    if (!this.schoolGenClassId) {
      this.error = 'Please select a class to generate a report for.';
      return;
    }
    if (!this.pathwayGenStartDate || !this.pathwayGenEndDate) {
      this.error = 'Please select a start and end date.';
      return;
    }
    this.error = null;
    this.success = null;
    this.generatingClassReport = true;
    this.reportsService
      .generateClassSummary(this.schoolGenClassId, this.pathwayGenStartDate, this.pathwayGenEndDate)
      .subscribe({
        next: () => {
          this.generatingClassReport = false;
          this.success = 'Class report generated successfully!';
          this.loadSchoolReports();
          setTimeout(() => (this.success = null), 4000);
        },
        error: (err) => {
          this.generatingClassReport = false;
          this.error = err.error?.message || 'Failed to generate class report';
          console.error('Error generating class report:', err);
        },
      });
  }

  generatePathway(pathwayId: string): void {
    if (!pathwayId) return;
    this.error = null;
    this.success = null;
    this.generatingPathwayIds.add(pathwayId);
    this.reportsService
      .generatePathwayReport(pathwayId, this.pathwayGenStartDate, this.pathwayGenEndDate)
      .subscribe({
        next: () => {
          this.generatingPathwayIds.delete(pathwayId);
          this.success = 'Pathway report generated successfully!';
          this.loadSchoolReports();
          setTimeout(() => (this.success = null), 4000);
        },
        error: (err) => {
          this.generatingPathwayIds.delete(pathwayId);
          this.error = err.error?.message || 'Failed to generate pathway report';
          console.error('Error generating pathway report:', err);
        },
      });
  }

  generateAllPathways(): void {
    if (this.pathways.length === 0) return;
    if (!this.pathwayGenStartDate || !this.pathwayGenEndDate) {
      this.error = 'Please select a start and end date.';
      return;
    }
    this.error = null;
    this.success = null;
    this.generatingAllPathways = true;

    const requests = this.pathways.map((p) =>
      this.reportsService
        .generatePathwayReport(p._id, this.pathwayGenStartDate, this.pathwayGenEndDate)
        .pipe(catchError((err) => {
          console.error('Failed to generate report for pathway', p._id, err?.message || err);
          return of(null);
        })),
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.generatingAllPathways = false;
        this.success = 'All pathway reports generated successfully!';
        this.loadSchoolReports();
        setTimeout(() => (this.success = null), 5000);
      },
      error: () => {
        this.generatingAllPathways = false;
      },
    });
  }

  isGeneratingPathway(pathwayId: string): boolean {
    return this.generatingPathwayIds.has(pathwayId);
  }

  // Individual student report generation state
  studentSearchTerm: string = '';
  searchingStudents = false;
  studentSearchResults: any[] = [];
  individualStudentGenReportType: string = 'comprehensive';
  generatingStudentIds: Set<string> = new Set();

  // All-students report generation state
  allStudentsReportType: string = 'comprehensive';
  allStudentsGenStartDate: string = this.yearStart();
  allStudentsGenEndDate: string = this.today();
  generatingAllStudents = false;
  allStudentsProgress = { done: 0, total: 0 };

  searchStudents(): void {
    const term = (this.studentSearchTerm || '').trim();
    if (!term) {
      this.error = 'Enter an admission number or student name to search.';
      return;
    }
    this.error = null;
    this.searchingStudents = true;
    this.studentService.getAll(undefined, term).subscribe({
      next: (students: any[]) => {
        this.studentSearchResults = students || [];
        this.searchingStudents = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to search students';
        this.searchingStudents = false;
        console.error('Error searching students:', err);
      },
    });
  }

  isGeneratingStudentReport(studentId: string): boolean {
    return this.generatingStudentIds.has(studentId);
  }

  generateAllStudentsReport(): void {
    if (!this.allStudentsGenStartDate || !this.allStudentsGenEndDate) {
      this.error = 'Please select a start and end date.';
      return;
    }
    this.error = null;
    this.success = null;
    this.generatingAllStudents = true;
    this.allStudentsProgress = { done: 0, total: 0 };

    this.studentService.getAll().subscribe({
      next: (students: any[]) => {
        const list = (students || []).filter((s) => s?._id);
        if (list.length === 0) {
          this.generatingAllStudents = false;
          this.error = 'No students found in the school.';
          return;
        }
        this.allStudentsProgress.total = list.length;

        const requests = list.map((s) =>
          this.reportsService
            .generateStudentReport(
              s._id,
              this.allStudentsReportType,
              this.allStudentsGenStartDate,
              this.allStudentsGenEndDate,
            )
            .pipe(
              tap(() => this.allStudentsProgress.done++),
              catchError((err) => {
                console.error('Failed to generate report for student', s._id, err?.message || err);
                this.allStudentsProgress.done++;
                return of(null);
              }),
            ),
        );

        forkJoin(requests).subscribe({
          next: (results: any[]) => {
            this.generatingAllStudents = false;
            const succeeded = (results || []).filter(Boolean).length;
            this.success = `Student reports generated for ${succeeded} of ${list.length} students!`;
            this.loadStudentReports();
            setTimeout(() => (this.success = null), 6000);
          },
          error: () => {
            this.generatingAllStudents = false;
            this.error = 'Failed to generate student reports.';
          },
        });
      },
      error: (err) => {
        this.generatingAllStudents = false;
        this.error = err.error?.message || 'Failed to load students';
        console.error('Error loading students for report generation:', err);
      },
    });
  }

  generateStudentReportFor(student: any): void {
    if (!student?._id) return;
    this.error = null;
    this.success = null;
    this.generatingStudentIds.add(student._id);
    this.reportsService
      .generateStudentReport(
        student._id,
        this.individualStudentGenReportType,
        this.pathwayGenStartDate,
        this.pathwayGenEndDate,
      )
      .subscribe({
        next: () => {
          this.generatingStudentIds.delete(student._id);
          this.success = `Report generated for ${student.firstName || ''} ${student.lastName || ''}!`;
          setTimeout(() => (this.success = null), 4000);
        },
        error: (err) => {
          this.generatingStudentIds.delete(student._id);
          this.error = err.error?.message || 'Failed to generate student report';
          console.error('Error generating student report:', err);
        },
      });
  }

  getPathwayReportTitle(report: any): string {
    if (report?.reportType === 'pathway') {
      const name =
        report.pathway?.name ||
        report.performanceStatistics?.pathwayName ||
        report.pathwayDistribution
          ? Object.keys(report.pathwayDistribution)[0]
          : '';
      return name ? `Pathway Report: ${name}` : 'Pathway Report';
    }
    if (report?.reportType === 'class') {
      const c = report.class || {};
      const section = c.section ? ` - ${c.section}` : '';
      return c.name ? `Class Report: ${c.name}${section}` : 'Class Report';
    }
    return 'School Report';
  }

  onPathwayChange(): void {
    this.error = null;
    if (!this.selectedPathwayId) {
      this.pathwayReport = null;
      return;
    }
    this.pathwayReportLoading = true;
    this.reportsService.getPathwayReport(this.selectedPathwayId).subscribe({
      next: (report: any) => {
        this.pathwayReport = report;
        this.pathwayReportLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load pathway report';
        this.pathwayReportLoading = false;
        console.error('Error loading pathway report:', err);
      },
    });
  }

  viewPathway(pathway: any): void {
    if (!pathway?._id) return;
    this.selectedPathwayId = pathway._id;
    this.onPathwayChange();
  }

  downloadPathway(pathway: any): void {
    if (!pathway?._id) return;
    this.error = null;
    this.success = null;
    this.reportsService.getPathwayReport(pathway._id).subscribe({
      next: (report: any) => {
        this.pathwayReport = report;
        this.downloadPathwayReport(pathway);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load pathway report';
        console.error('Error loading pathway report:', err);
      },
    });
  }

  getSelectedPathway(): any {
    return this.pathways.find((p) => p._id === this.selectedPathwayId) || null;
  }

  getPathwayReportEntries(): any[] {
    const data = this.pathwayReport?.data || [];
    return Array.isArray(data) ? data : [];
  }

  loadClasses(): void {
    this.classService.getAll().subscribe({
      next: (c: any[]) => {
        this.classes = c || [];
      },
      error: (err) => {
        console.error('Failed to load classes for reports', err);
      },
    });
  }

  private loadStudentReportsForParent(): void {
    this.loading = true;
    this.error = null;

    this.parentPortalService.getChildren().subscribe({
      next: (kids: any[]) => {
        const children = kids || [];
        if (children.length === 0) {
          this.studentReports = [];
          this.studentPage = 1;
          this.loading = false;
          return;
        }

        this.children = children;

        const requests = children.map((c) =>
          this.reportsService.getStudentReportsByStudentId(c._id).pipe(
            catchError((err) => {
              // If a child's reports endpoint returns 404 or other errors (e.g. no performance data),
              // treat as empty reports instead of failing the whole join.
              console.warn('Failed to load reports for child', c._id, err?.message || err);
              return of([]);
            }),
          ),
        );

        forkJoin(requests).subscribe({
          next: (results: any[]) => {
            // flatten and attach student info
            this.studentReports = [];
            results.forEach((rset, idx) => {
              const child = children[idx];
              const reports = rset || [];
              reports.forEach((r: any) => {
                r.studentId = { _id: child._id, firstName: child.firstName, lastName: child.lastName };
              });
              this.studentReports.push(...reports);
            });
            this.studentPage = 1;
            this.loading = false;
          },
          error: (err) => {
            this.error = err.error?.message || 'Failed to load student reports for your children';
            this.loading = false;
            console.error('Error loading parent student reports', err);
          },
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load children';
        this.loading = false;
      },
    });
  }

  loadStudentReports(): void {
    this.loading = true;
    this.error = null;
    this.reportsService.getAllStudentReports().subscribe({
      next: (data) => {
        this.studentReports = data.data || data;
        this.studentPage = 1;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load student reports';
        this.loading = false;
        console.error('Error loading student reports:', err);
      },
    });
  }

  loadSchoolReports(): void {
    this.reportsService.getAllSchoolReports().subscribe({
      next: (data) => {
        this.schoolReports = data;
        this.schoolPage = 1;
      },
      error: (err) => {
        console.error('Error loading school reports:', err);
      },
    });
  }

  loadAnalytics(): void {
    this.reportsService.getReportAnalytics().subscribe({
      next: (data) => {
        this.reportAnalytics = data;
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
      },
    });
  }

  onReportTypeChange(): void {
    if (this.selectedReportType === 'school' && this.schoolReports.length === 0) {
      this.loadSchoolReports();
    }
    this.studentPage = 1;
    this.schoolPage = 1;
    this.pathwayPage = 1;
    this.selectedPathwayId = '';
    this.pathwayReport = null;
  }

  get canGenerateReport(): boolean {
    return this.isParent && this.selectedChildId !== 'all';
  }

  get selectedChildName(): string {
    const child = this.children.find((c) => c._id === this.selectedChildId);
    return child ? `${child.firstName} ${child.lastName}` : '';
  }

  openGenerateModal(): void {
    this.error = null;
    this.success = null;

    this.generateReportForm = {
      studentId: this.isParent && this.selectedChildId !== 'all' ? this.selectedChildId : '',
      classId: (this.isAdmin || this.isTeacher) && this.classes.length > 0 ? this.classes[0]._id : '',
      reportType: this.isParent && this.selectedReportTypeFilter !== 'all' ? this.selectedReportTypeFilter : 'comprehensive',
      startDate: '',
      endDate: '',
    };

    // Ensure dropdown defaults: if parent -> student mode, else keep current selection
    if (this.isParent) {
      this.generateReportForm.studentId = this.selectedChildId !== 'all' ? this.selectedChildId : '';
    }

    this.showGenerateModal = true;
  }

  closeGenerateModal(): void {
    this.showGenerateModal = false;
  }

  generateReport(): void {
    // Show page spinner while generating and reloading reports
    this.loading = true;
    // Parent: generate for a single student
    if (this.isParent) {
      if (!this.generateReportForm.studentId || !this.generateReportForm.studentId.trim()) {
        this.error = 'Student ID is required';
        return;
      }

      this.isSubmitting = true;
      this.error = null;

      this.reportsService
        .generateStudentReport(
          this.generateReportForm.studentId,
          this.generateReportForm.reportType,
          this.generateReportForm.startDate || undefined,
          this.generateReportForm.endDate || undefined,
        )
        .subscribe({
          next: () => {
            this.success = 'Report generated successfully!';
            this.closeGenerateModal();
            this.loadStudentReportsForParent();
            this.isSubmitting = false;
            this.loading = false;
            setTimeout(() => (this.success = null), 3000);
          },
          error: (err) => {
            this.error = err.error?.message || 'Failed to generate report';
            this.isSubmitting = false;
            this.loading = false;
            console.error('Error generating report:', err);
          },
        });
      return;
    }

    // Determine selected class first
    const classId = this.generateReportForm.classId;

    // Non-parent (teacher/admin): if the page's selectedReportType is 'school', generate a class summary
    if (this.selectedReportType === 'school') {
      this.isSubmitting = true;
      this.error = null;
      this.loading = true;
      this.reportsService.generateClassSummary(classId, this.generateReportForm.startDate || undefined, this.generateReportForm.endDate || undefined)
        .subscribe({
          next: () => {
            this.success = 'Class summary report generated successfully!';
            this.closeGenerateModal();
            this.loadStudentReports();
            this.isSubmitting = false;
            this.loading = false;
            setTimeout(() => (this.success = null), 4000);
          },
          error: (err) => {
            this.error = err.error?.message || 'Failed to generate class summary report';
            this.isSubmitting = false;
            this.loading = false;
            console.error('Error generating class summary report:', err);
          }
        });
      return;
    }

    // Otherwise generate student reports for each student in the class
    if (!classId) {
      this.error = 'Please select a class to generate reports for';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    // Fetch students in class then generate a student report for each (in parallel)
    this.studentService.getByClass(classId).subscribe({
      next: (students: any[]) => {
        const targets = (students || []).map((s) =>
          this.reportsService.generateStudentReport(
            s._id,
            this.generateReportForm.reportType,
            this.generateReportForm.startDate || undefined,
            this.generateReportForm.endDate || undefined,
          ).pipe(catchError(err => {
            console.error('Failed to generate report for student', s._id, err?.message || err);
            return of(null);
          })),
        );

        if (targets.length === 0) {
          this.error = 'No students found in selected class';
          this.isSubmitting = false;
          return;
        }

        forkJoin(targets).subscribe({
          next: () => {
            this.success = 'Class reports generated successfully!';
            this.closeGenerateModal();
            this.loadStudentReports();
            this.isSubmitting = false;
            this.loading = false;
            setTimeout(() => (this.success = null), 4000);
          },
          error: (err) => {
            this.error = err.error?.message || 'Failed to generate class reports';
            this.isSubmitting = false;
            this.loading = false;
            console.error('Error generating class reports:', err);
          },
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load students for class';
        this.isSubmitting = false;
        console.error('Error fetching students for class:', err);
      },
    });
  }

  openViewModal(report: any, isSchool: boolean = false): void {
    this.showViewModal = true;
    this.viewLoading = true;
    this.selectedReport = null;
    this.error = null;
    this.success = null;

    const request$ = isSchool
      ? this.reportsService.getSchoolReport(report._id)
      : this.reportsService.getStudentReport(report._id);

    request$.subscribe({
      next: (freshReport) => {
        this.selectedReport = freshReport;
        // precompute derived fields for template safety
        this.selectedReportPathwayDistribution = freshReport?.pathwayDistribution || null;
        this.selectedReportPerformanceData = (freshReport?.performanceStatistics?.data) || [];
        // dedupe and sort pathway entries: highPerformers desc, then averageScore desc, then totalStudents desc
        const deduped = this.getUniquePathwayEntries(this.selectedReportPerformanceData || []);
        this.sortedPathwayEntries = deduped.sort((a: any, b: any) => {
          // Prefer sorting by average score (highest first). Fallback to highPerformers count, then total students.
          const getAverage = (entry: any) => {
            if (entry?.statistics?.averageScore !== undefined && entry?.statistics?.averageScore !== null) {
              return Number(entry.statistics.averageScore) || 0;
            }
            if (Array.isArray(entry?.students) && entry.students.length) {
              const sum = entry.students.reduce((acc: number, s: any) => acc + (Number(s.averageScore) || 0), 0);
              return sum / entry.students.length;
            }
            return 0;
          };

          const aAvg = getAverage(a);
          const bAvg = getAverage(b);
          if (bAvg !== aAvg) return bAvg - aAvg;

          const aHigh = (a.statistics?.highPerformers || 0);
          const bHigh = (b.statistics?.highPerformers || 0);
          if (bHigh !== aHigh) return bHigh - aHigh;

          const aTotal = (a.statistics?.totalStudents || (a.students || []).length || 0);
          const bTotal = (b.statistics?.totalStudents || (b.students || []).length || 0);
          return bTotal - aTotal;
        });
        this.selectedReportPathwayNames = this.selectedReportPathwayDistribution
          ? Object.keys(this.selectedReportPathwayDistribution)
          : this.getPathwayNamesFromPerformance(freshReport);
        this.viewLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load report details';
        this.viewLoading = false;
        console.error('Error loading report details:', err);
      },
    });
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedReport = null;
    this.viewLoading = false;
  }

  getSubjectScoresChartData(): any[] {
    const scores = this.selectedReport?.performanceSummary?.subjectScores;
    if (!Array.isArray(scores)) return [];
    return scores
      .map((s: any) => ({ name: s.subjectName || 'Unknown', value: Number(s.averageScore) || 0 }))
      .sort((a: any, b: any) => b.value - a.value);
  }

  getTermTrendsChartData(): any[] {
    const trends = this.selectedReport?.performanceSummary?.trends;
    if (!Array.isArray(trends)) return [];
    return trends
      .map((t: any) => ({ name: t.term || 'Unknown', value: Number(t.averageScore) || 0 }))
      .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  }

  viewReport(report: any): void {
    this.openViewModal(report, false);
  }

  viewSchoolReport(report: any): void {
    this.openViewModal(report, true);
  }

  private generatePdf(title: string, bodyLines: { label: string; value: string }[][], sections: { heading: string; content: string[] }[]): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 190;
    let y = 20;

    const addTitle = (text: string, size: number, color: string) => {
      doc.setFontSize(size);
      doc.setTextColor(color);
      doc.text(text, pageW / 2, y, { align: 'center' });
      y += size * 0.5;
    };

    const addLine = () => {
      y += 2;
      doc.setDrawColor(30, 62, 95);
      doc.setLineWidth(0.8);
      doc.line(10, y, 200, y);
      y += 6;
    };

    const addBodyText = (text: string, size: number, indent = 0) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.setFontSize(size);
      doc.setTextColor(50);
      const lines = doc.splitTextToSize(text, pageW - indent * 2);
      for (const line of lines) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, 10 + indent, y);
        y += size * 0.45;
      }
    };

    addTitle(title, 22, '#1e3a5f');
    addLine();

    for (const group of bodyLines) {
      for (const item of group) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setTextColor(80);
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, 15, y);
        const labelW = doc.getTextWidth(item.label + '  ');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40);
        doc.text(item.value, 15 + labelW, y);
        y += 7;
      }
      y += 2;
    }

    for (const section of sections) {
      if (section.content.length === 0) continue;
      if (y > 265) { doc.addPage(); y = 20; }
      addTitle(section.heading, 16, '#1e3a5f');
      y += 2;
      for (const line of section.content) {
        addBodyText(line, 10, 5);
      }
      y += 4;
    }

    y = Math.max(y, 260);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('Generated by CBE Pathway System', pageW / 2, y, { align: 'center' });
    doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  downloadReport(report: any): void {
    try {
      const s = report.studentId || {};
      const r = report;
      const bodyLines = [
        [
          { label: 'Student:', value: `${s.firstName || ''} ${s.lastName || ''}` },
          { label: 'Admission No:', value: s.admissionNumber || 'N/A' },
        ],
        [
          { label: 'Report Type:', value: r.reportType || 'N/A' },
          { label: 'Generated:', value: r.generatedDate ? new Date(r.generatedDate).toLocaleString() : 'N/A' },
        ],
      ];
      if (r.reportPeriod) {
        bodyLines.push([
          { label: 'Period:', value: `${new Date(r.reportPeriod.startDate).toLocaleDateString()} — ${new Date(r.reportPeriod.endDate).toLocaleDateString()}` },
        ]);
      }
      const sections: { heading: string; content: string[] }[] = [];
      if (r.reportSummary) {
        sections.push({ heading: 'Summary', content: [r.reportSummary] });
      }
      if (r.performanceSummary) {
        const ps = r.performanceSummary;
        const perfLines = [
          `Overall GPA: ${ps.overallGPA ?? 'N/A'}`,
          `Overall Score: ${ps.overallScore ?? 'N/A'}`,
          `Total Records: ${ps.totalRecords ?? 'N/A'}`,
        ];
        if (ps.strengths?.length) {
          perfLines.push(`Strengths: ${ps.strengths.join(', ')}`);
        }
        if (ps.weaknesses?.length) {
          perfLines.push(`Areas for Improvement: ${ps.weaknesses.join(', ')}`);
        }
        sections.push({ heading: 'Performance Summary', content: perfLines });
        if (ps.subjectScores?.length) {
          const subLines = ps.subjectScores.map((sub: any) =>
            `  ${sub.subjectName}: ${sub.averageScore} (${sub.records} records)`);
          sections.push({ heading: 'Subject Scores', content: subLines });
        }
        if (ps.trends?.length) {
          const trendLines = ps.trends.map((t: any) =>
            `  ${t.term}: ${t.averageScore}`);
          sections.push({ heading: 'Term Trends', content: trendLines });
        }
        if (ps.gradeDistribution) {
          const gradeLines = Object.entries(ps.gradeDistribution).map(([k, v]) => `  ${k}: ${v}`);
          sections.push({ heading: 'Grade Distribution', content: gradeLines });
        }
      }
      if (r.pathwayRecommendation) {
        sections.push({
          heading: 'Pathway Recommendation',
          content: [
            `Pathway: ${r.pathwayRecommendation.recommendedPathway?.name || 'N/A'}`,
            `Student GPA: ${r.pathwayRecommendation.studentGPA ?? 'N/A'}`,
          ],
        });
      }
      if (r.teacherNotes) {
        sections.push({ heading: 'Teacher Notes', content: [r.teacherNotes] });
      }
      this.generatePdf('Student Report', bodyLines, sections);
    } catch (err: any) {
      console.error('Failed to download student report:', err);
      this.error = 'Failed to download report. Please try again.';
    }
  }

  downloadSchoolReport(report: any): void {
    try {
      const r = report;
      const bodyLines = [
        [
          { label: 'Report Type:', value: r.reportType || 'School' },
          { label: 'Generated:', value: r.generatedDate ? new Date(r.generatedDate).toLocaleString() : 'N/A' },
        ],
      ];
      if (r.reportPeriod) {
        bodyLines.push([
          { label: 'Period:', value: `${new Date(r.reportPeriod.startDate).toLocaleDateString()} — ${new Date(r.reportPeriod.endDate).toLocaleDateString()}` },
        ]);
      }
      if (r.class?.name) {
        bodyLines.push([
          { label: 'Class:', value: `${r.class.name}${r.class.section ? ' - ' + r.class.section : ''}` },
        ]);
      }
      bodyLines.push([
        { label: 'Total Students:', value: `${r.totalStudents ?? 'N/A'}` },
      ]);
      if (r.generatedBy) {
        const gb = r.generatedBy;
        const generatedByName = typeof gb === 'object'
          ? `${gb.firstName || ''} ${gb.lastName || ''}`.trim() || gb._id || 'Unknown'
          : String(gb);
        bodyLines.push([{ label: 'Generated By:', value: generatedByName }]);
      }
      const sections: { heading: string; content: string[] }[] = [];
      if (r.pathwayDistribution) {
        const distLines = Object.entries(r.pathwayDistribution)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([k, v]) => `${k}: ${v} students`);
        sections.push({ heading: 'Pathway Distribution', content: distLines });
      }
      if (r.performanceStatistics) {
        const ps = r.performanceStatistics;
        const psLines: string[] = [];
        if (ps.class?.name) {
          psLines.push(`Class: ${ps.class.name}${ps.class.section ? ' - ' + ps.class.section : ''}`);
        }
        psLines.push(`Total Students in Class: ${ps.totalClassStudents ?? 'N/A'}`);
        psLines.push(`Students with Performance Data: ${ps.studentsWithPerformance ?? 'N/A'}`);
        psLines.push(`Pathways Evaluated: ${ps.totalPathways ?? 'N/A'}`);
        sections.push({ heading: 'Class Summary', content: psLines });

        if (ps.data?.length) {
          for (const entry of ps.data) {
            const pn = entry.pathway?.name || 'Unknown Pathway';
            const st = entry.statistics || {};
            const entryLines = [
              `Students: ${st.totalStudents ?? 0}`,
              `Average Score: ${st.averageScore ?? 'N/A'}`,
              `High Performers (>=80): ${st.highPerformers ?? 0}`,
              `Average Performers (60-79): ${st.averagePerformers ?? 0}`,
              `Needs Support (<60): ${st.needsSupport ?? 0}`,
            ];
            if (entry.students?.length) {
              entryLines.push('');
              entryLines.push('Top Students:');
              const topStudents = entry.students.slice(0, 10);
              for (const stu of topStudents) {
                entryLines.push(`  ${stu.studentName || 'N/A'} — Avg: ${stu.averageScore ?? '-'} | GPA: ${stu.studentGPA ?? '-'} | High: ${stu.highestScore ?? '-'} | Low: ${stu.lowestScore ?? '-'}`);
              }
              if (entry.students.length > 10) {
                entryLines.push(`  ... and ${entry.students.length - 10} more`);
              }
            }
            sections.push({ heading: `Pathway: ${pn}`, content: entryLines });
          }
        }
      }
      this.generatePdf('School Report', bodyLines, sections);
    } catch (err: any) {
      console.error('Failed to download school report:', err);
      this.error = 'Failed to download report. Please try again.';
    }
  }

  downloadPathwayReport(pathway?: any): void {
    try {
      const r = this.pathwayReport;
      if (!r) {
        this.error = 'No pathway report loaded to download.';
        return;
      }

      const pathwayInfo = pathway || this.getSelectedPathway() || {};
      const filters = r.filters || {};

      const bodyLines = [
        [
          { label: 'Pathway:', value: `${pathwayInfo.name || filters.pathwayId || 'N/A'} (${pathwayInfo.code || ''})` },
          { label: 'Generated:', value: r.generatedDate ? new Date(r.generatedDate).toLocaleString() : 'N/A' },
        ],
        [
          { label: 'Academic Year:', value: filters.academicYear || 'N/A' },
          { label: 'Term:', value: filters.term || 'All' },
        ],
      ];

      const sections: { heading: string; content: string[] }[] = [];
      const entries = this.getPathwayReportEntries();
      for (const entry of entries) {
        const st = entry.statistics || {};
        const entryLines = [
          `Pathway: ${entry.pathway?.name || pathwayInfo.name || 'Unknown'}`,
          `Total Students: ${st.totalStudents ?? 0}`,
          `Average Score: ${st.averageScore ?? 'N/A'}%`,
          `Average Completion Rate: ${st.averageCompletionRate ?? 'N/A'}%`,
          `High Performers (>=80): ${st.highPerformers ?? 0}`,
          `Average Performers (60-79): ${st.averagePerformers ?? 0}`,
          `Needs Support (<60): ${st.needsSupport ?? 0}`,
        ];
        if (entry.students?.length) {
          entryLines.push('');
          entryLines.push('Students:');
          for (const s of entry.students) {
            entryLines.push(
              `  ${s.studentName || 'N/A'} (${s.admissionNumber || 'N/A'}) — Class: ${s.class || 'N/A'} | Avg: ${s.averageScore ?? '-'} | Completion: ${s.completionRate ?? '-'}% | High: ${s.highestScore ?? '-'} | Low: ${s.lowestScore ?? '-'} | Records: ${s.performanceRecords ?? '-'}`,
            );
          }
        }
        sections.push({ heading: entry.pathway?.name || pathwayInfo.name || 'Pathway Report', content: entryLines });
      }

      const title = `Pathway Report - ${pathwayInfo.name || ''}`.trim();
      this.generatePdf(title, bodyLines, sections);
    } catch (err: any) {
      console.error('Failed to download pathway report:', err);
      this.error = 'Failed to download report. Please try again.';
    }
  }

  deleteReport(id: string): void {
    if (confirm('Are you sure you want to delete this report?')) {
      this.reportsService.deleteReport(id).subscribe({
        next: () => {
          this.success = 'Report deleted successfully!';
          this.loadStudentReports();
          setTimeout(() => (this.success = null), 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to delete report';
          console.error('Error deleting report:', err);
        },
      });
    }
  }

  checkRole(role: string): boolean {
    const r = this.authService.getUserRole() || localStorage.getItem('role') || sessionStorage.getItem('userRole') || '';
    if (!r) return false;
    if (r === 'super_admin' || r === 'admin') return true;
    return r === role;
  }

  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  canViewReports(): boolean {
    return this.isAdmin || this.isTeacher || this.isParent || this.hasPermission(SchoolPermission.VIEW_REPORTS);
  }

  canExportReports(): boolean {
    return this.isAdmin || this.isTeacher || this.hasPermission(SchoolPermission.EXPORT_REPORTS);
  }

  canGenerateReports(): boolean {
    return this.isAdmin || this.isTeacher || this.isParent || this.hasPermission(SchoolPermission.GENERATE_REPORTS);
  }

  getDistributionKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  getPathwayNamesFromPerformance(report: any): string[] {
    try {
      const data = (report && (report.performanceStatistics || report.performanceStatistics))?.data || [];
      return Array.isArray(data) ? data.map((d: any) => (d?.pathway?.name || 'Unknown')) : [];
    } catch (e) {
      return [];
    }
  }

  getStudentsFromEntry(entry: any): any[] {
    try {
      const students = entry?.students || [];
      return Array.isArray(students) ? students : [];
    } catch (e) {
      return [];
    }
  }

  getUniquePathwayEntries(entries: any[] | undefined): any[] {
    try {
      const list = Array.isArray(entries) ? entries : [];
      const seen = new Set<string>();
      const out: any[] = [];
      for (const e of list) {
        const key = e?.pathway?._id || e?.pathway?.name || JSON.stringify(e?.pathway || {});
        if (!seen.has(key)) {
          seen.add(key);
          out.push(e);
        }
      }
      return out;
    } catch (err) {
      return entries || [];
    }
  }
}
