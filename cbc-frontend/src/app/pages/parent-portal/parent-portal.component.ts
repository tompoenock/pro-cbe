import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import { ParentPortalService } from './parent-portal.service';
import { ReportsService } from '../reports/reports.service';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-parent-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-portal.component.html',
  styleUrls: ['./parent-portal.component.scss'],
})
export class ParentPortalComponent implements OnInit {
  children: any[] = [];
  selectedChildId: string = '';
  selectedChild: any = null;
  studentPerformance: any = null;
  currentPathway: any = null;
  pathwayRecommendations: any = null;
  studentReports: any[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  darkMode = false;

  get hasRecommendedPathway(): boolean {
    return !!this.pathwayRecommendations?.recommendedPathways?.length;
  }

  get topRecommendedPathway(): any {
    return this.pathwayRecommendations?.recommendedPathways?.[0];
  }

  get displayedPathway(): any {
    return this.topRecommendedPathway || this.currentPathway?.pathwayId || null;
  }

  get pathwayCaption(): string {
    return this.topRecommendedPathway ? 'Recommended Pathway' : 'Current Pathway';
  }

  get currentPathwayName(): string {
    return this.currentPathway?.pathwayId?.name || 'Not assigned';
  }

  get performanceStats(): any {
    const subjects = this.studentPerformance?.subjects || [];
    const scores = subjects
      .map((subject: any) => Number(subject.score))
      .filter((score: number) => !Number.isNaN(score));

    const examCount = subjects.length;
    if (examCount === 0) {
      return null;
    }

    const averageScore = scores.length
      ? Math.round((scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length) * 100) / 100
      : 0;
    const highestScore = scores.length ? Math.max(...scores) : 0;
    const lowestScore = scores.length ? Math.min(...scores) : 0;
    const strongSubjects = scores.filter((score: number) => score >= 75).length;
    const needsSupport = scores.filter((score: number) => score < 60).length;

    const gradeCounts = subjects.reduce((counts: any, subject: any) => {
      const grade = subject.grade || 'N/A';
      counts[grade] = (counts[grade] || 0) + 1;
      return counts;
    }, {});

    return {
      examCount,
      averageScore,
      highestScore,
      lowestScore,
      strongSubjects,
      needsSupport,
      gradeCounts,
    };
  }

  // Report modal
  showReportModal = false;
  activeReport: any = null;

  constructor(
    private parentPortalService: ParentPortalService,
    private reportsService: ReportsService,
    private themeService: ThemeService,
  ) {}

  // inject theme service

  ngOnInit(): void {
    this.themeService.darkMode$.subscribe((d: boolean) => (this.darkMode = d));
    this.loadChildren();
  }

  loadChildren(): void {
    this.loading = true;
    this.error = null;

    this.parentPortalService.getChildren().subscribe({
      next: (data: any[]) => {
        this.children = data || [];
        if (this.children.length > 0) {
          this.selectedChildId = this.children[0]._id;
          this.onChildChange();
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Unable to load child list.';
        this.loading = false;
      },
    });
  }

  onChildChange(): void {
    if (!this.selectedChildId) {
      this.selectedChild = null;
      this.studentPerformance = null;
      this.currentPathway = null;
      this.pathwayRecommendations = null;
      this.studentReports = [];
      return;
    }

    this.selectedChild = this.children.find((c) => c._id === this.selectedChildId);

    if (this.selectedChild) {
      this.loading = true;
      this.loadStudentData();
    }
  }

  selectChild(childId: string): void {
    if (this.selectedChildId === childId) {
      return;
    }
    this.selectedChildId = childId;
    this.onChildChange();
  }

  loadStudentData(): void {
    const studentId = this.selectedChildId;

    Promise.all([
      this.loadStudentProfile(studentId),
      this.loadPerformance(studentId),
      this.loadCurrentPathway(studentId),
      this.loadPathwayRecommendations(studentId),
      this.loadReports(studentId),
    ])
      .then(() => {
        this.loading = false;
      })
      .catch((err) => {
        console.error('Error loading student data:', err);
        this.loading = false;
      });
  }

  private loadStudentProfile(studentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.parentPortalService.getStudentData(studentId).subscribe({
        next: (data) => {
          this.selectedChild = { ...this.selectedChild, ...data };
          resolve();
        },
        error: (err) => reject(err),
      });
    });
  }

  private loadPerformance(studentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.parentPortalService.getStudentPerformance(studentId).subscribe({
        next: (data) => {
          this.studentPerformance = data;
          resolve();
        },
        error: (err) => {
          console.error('Error loading performance:', err);
          resolve(); // Don't reject, continue with other data
        },
      });
    });
  }

  private loadCurrentPathway(studentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.parentPortalService.getStudentPathway(studentId).subscribe({
        next: (data) => {
          this.currentPathway = data;
          if (!this.pathwayRecommendations?.recommendedPathways?.length) {
            this.pathwayRecommendations = {
              studentGPA: this.studentPerformance?.overallGPA || null,
              recommendedPathways: this.currentPathway?.pathwayId ? [this.currentPathway.pathwayId] : [],
            };
          }
          resolve();
        },
        error: (err) => {
          console.error('Error loading pathway:', err);
          resolve();
        },
      });
    });
  }

  private loadPathwayRecommendations(studentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.parentPortalService.getPathwayRecommendations(studentId).subscribe({
        next: (data) => {
          this.pathwayRecommendations = data;
          resolve();
        },
        error: (err) => {
          console.error('Error loading pathway recommendations:', err);
          resolve();
        },
      });
    });
  }

  private loadReports(studentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.parentPortalService.getStudentReports(studentId).subscribe({
        next: (data) => {
          this.studentReports = data;
          resolve();
        },
        error: (err) => {
          console.error('Error loading reports:', err);
          resolve();
        },
      });
    });
  }

  viewReport(report: any): void {
    this.error = null;
    this.activeReport = null;

    const id = report?._id || report?.id || report?.reportId || report?.reportId || report?.id;
    if (!id) {
      this.error = 'Report id not available';
      return;
    }

    this.showReportModal = true;
    this.reportsService.getStudentReport(id).subscribe({
      next: (data) => {
        this.activeReport = data;
      },
      error: (err) => {
        console.error('Error fetching report:', err);
        this.error = err.error?.message || 'Failed to load report';
        this.showReportModal = false;
      },
    });
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.activeReport = null;
  }

  deleteReport(report: any): void {
    if (!report?._id) {
      this.error = 'Unable to delete report; missing report id.';
      return;
    }

    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    this.reportsService.deleteReport(report._id).subscribe({
      next: () => {
        this.success = 'Report deleted successfully.';
        this.loadReports(this.selectedChildId);
        setTimeout(() => (this.success = null), 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete report.';
        console.error('Delete report error:', err);
      },
    });
  }

  downloadReportPdf(): void {
    if (!this.activeReport) return;
    const r = this.activeReport;
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

    const addField = (label: string, value: string) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.setFont('helvetica', 'bold');
      doc.text(label, 15, y);
      const labelW = doc.getTextWidth(label + '  ');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40);
      doc.text(value, 15 + labelW, y);
      y += 7;
    };

    addTitle('Student Report', 22, '#1e3a5f');
    addLine();
    addField('Type:', r.reportType || 'N/A');
    addField('Generated:', r.generatedDate ? new Date(r.generatedDate).toLocaleString() : 'N/A');
    if (r.reportPeriod) {
      addField('Period:', `${new Date(r.reportPeriod.startDate).toLocaleDateString()} — ${new Date(r.reportPeriod.endDate).toLocaleDateString()}`);
    }
    y += 4;

    if (r.reportSummary) {
      if (y > 265) { doc.addPage(); y = 20; }
      addTitle('Summary', 16, '#1e3a5f');
      y += 2;
      addBodyText(r.reportSummary, 10, 5);
      y += 4;
    }

    if (r.performanceSummary) {
      const ps = r.performanceSummary;
      if (y > 265) { doc.addPage(); y = 20; }
      addTitle('Performance Summary', 16, '#1e3a5f');
      y += 2;
      addBodyText(`Overall GPA: ${ps.overallGPA ?? 'N/A'}`, 10, 5);
      addBodyText(`Overall Score: ${ps.overallScore ?? 'N/A'}`, 10, 5);
      addBodyText(`Total Records: ${ps.totalRecords ?? 'N/A'}`, 10, 5);
      if (ps.strengths?.length) {
        addBodyText(`Strengths: ${ps.strengths.join(', ')}`, 10, 5);
      }
      if (ps.weaknesses?.length) {
        addBodyText(`Areas for Improvement: ${ps.weaknesses.join(', ')}`, 10, 5);
      }
      if (ps.subjectScores?.length) {
        y += 2;
        addTitle('Subject Scores', 14, '#1e3a5f');
        y += 2;
        for (const sub of ps.subjectScores) {
          addBodyText(`${sub.subjectName}: ${sub.averageScore} (${sub.records} records)`, 10, 10);
        }
      }
      if (ps.trends?.length) {
        y += 2;
        addTitle('Term Trends', 14, '#1e3a5f');
        y += 2;
        for (const t of ps.trends) {
          addBodyText(`${t.term}: ${t.averageScore}`, 10, 10);
        }
      }
      if (ps.gradeDistribution) {
        y += 2;
        addTitle('Grade Distribution', 14, '#1e3a5f');
        y += 2;
        for (const [grade, count] of Object.entries(ps.gradeDistribution)) {
          addBodyText(`${grade}: ${count}`, 10, 10);
        }
      }
      y += 4;
    }

    if (r.pathwayRecommendation) {
      if (y > 265) { doc.addPage(); y = 20; }
      addTitle('Pathway Recommendation', 16, '#1e3a5f');
      y += 2;
      addBodyText(`Pathway: ${r.pathwayRecommendation.recommendedPathway?.name || 'N/A'}`, 10, 5);
      addBodyText(`Student GPA: ${r.pathwayRecommendation.studentGPA ?? 'N/A'}`, 10, 5);
      y += 4;
    }

    if (r.teacherNotes) {
      if (y > 265) { doc.addPage(); y = 20; }
      addTitle('Teacher Notes', 16, '#1e3a5f');
      y += 2;
      addBodyText(r.teacherNotes, 10, 5);
      y += 4;
    }

    y = Math.max(y, 260);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('Generated by CBE Pathway System', pageW / 2, y, { align: 'center' });
    doc.save(`student-report-${r._id || 'report'}.pdf`);
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }


}
