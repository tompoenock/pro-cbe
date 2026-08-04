import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerformanceService } from '../../shared/services/performance.service';
import { ClassService } from '../../shared/services/class.service';
import { SubjectService } from '../../shared/services/subject.service';
import { StudentService } from '../../shared/services/student.service';
import { GradingService } from '../../shared/services/grading.service';
import { ThemeService } from '../../shared/services/theme.service';
import { AuthService } from '../../authentication/core/auth/auth.service';
import { ActionButtonsComponent, ActionType } from '../../shared/components/action-buttons/action-buttons.component';
import { DEFAULT_GRADES, GERMAN_FALLBACK_GRADES } from '../../shared/constants/grading.constants';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, ActionButtonsComponent],
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.css'],
})
export class PerformanceComponent implements OnInit {
  darkMode = false;
  classes: any[] = [];
  subjects: any[] = [];
  allClassSubjects: any[] = [];
  students: any[] = [];
  performances: any[] = [];
  overallPerformance: any = null;
  viewSortBy: 'studentName' | 'admNo' | 'average' = 'average';
  viewSortOrder: 'asc' | 'desc' = 'desc';
  gradeTemplate: any = null;
  loading = false;
  saving = false;
  showStudentModal = false;
  selectedStudent: any = null;
  error = '';  
  success = '';
  mode: 'view' | 'bulk' | 'overall' = 'view';

  filters = {
    classId: '',
    subjectId: '',
    academicYear: new Date().getFullYear().toString(),
    term: 'Term 1',
    examType: 'End-Term',
  };

  terms = ['Term 1', 'Term 2', 'Term 3'];
  examTypes = ['CAT 1', 'CAT 2', 'Mid-Term', 'End-Term', 'Final'];

  bulkScores: { studentId: string; studentName: string; admNo: string; score: number | null; status?: string }[] = [];

  currentUser: any = null;
  workflowLoading = false;
  workflowOverview: any = null;

  readonly WORKFLOW_STATUS = {
    DRAFT: 'draft',
    PENDING_CLASS_TEACHER: 'pending_class_teacher',
    PENDING_ADMIN: 'pending_admin',
    APPROVED: 'approved',
    RETURNED: 'returned',
  };

  constructor(
    private performanceService: PerformanceService,
    private classService: ClassService,
    private subjectService: SubjectService,
    private studentService: StudentService,
    private gradingService: GradingService,
    private themeService: ThemeService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.themeService.darkMode$.subscribe((d: boolean) => (this.darkMode = d));
    this.currentUser = this.authService.getUser();
    this.classService.getAll().subscribe({ next: (c: any) => (this.classes = c) });
    this.subjectService.getAll().subscribe({ next: (s: any) => (this.subjects = s) });
    // Load default grade template from backend
    this.gradingService.getDefault().subscribe({
      next: (template: any) => {
        console.log('✅ Loaded grading template from backend:', template);
        this.gradeTemplate = template;
        console.log('📊 Using template:', this.gradeTemplate?.name);
      },
      error: (err) => {
        console.error('❌ Failed to load grading template from backend:', err);
        console.warn('⚠️ Falling back to German grading template values.');
        this.gradeTemplate = { name: 'German grading fallback', grades: GERMAN_FALLBACK_GRADES };
        this.error = 'Grading template could not be loaded. Using fallback German grading scale.';
      }
    });
  }

  onClassChange() {
    if (this.filters.classId) {
      this.studentService.getByClass(this.filters.classId).subscribe({
        next: (s: any) => {
          this.students = s;
          // Load subjects for this class
          this.subjectService.getAll(this.filters.classId).subscribe({ 
            next: (subjs: any) => { 
              if (subjs.length > 0) {
                this.subjects = subjs;
                this.allClassSubjects = subjs; // Store all class subjects for display
              }
            }
          });
          // Load workflow overview
          this.loadWorkflowOverview();
          // Load performances for view mode
          if (this.mode === 'view') {
            this.loadPerformances();
          }
        },
      });
    }
  }

  // Filter students by subject when subject is selected
  onSubjectChange() {
    if (this.filters.classId && this.filters.subjectId) {
      this.loading = true;
      this.loadWorkflowOverview();
      // Refresh view mode performances for the selected subject
      if (this.mode === 'view') {
        this.loadPerformances();
      }
      // Get students in this class taking this subject
      this.studentService.getByClassAndSubject(this.filters.classId, this.filters.subjectId).subscribe({
        next: (s: any) => {
          this.bulkScores = s.map((item: any) => {
            const student = item.studentId || item;
            return {
              studentId: student._id,
              studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
              admNo: student.admissionNumber || '',
              score: null,
            };
          });
          // Pre-fill existing scores for the exact term/exam type/year combination
          this.performanceService.getAll({
            classId: this.filters.classId,
            subjectId: this.filters.subjectId,
            term: this.filters.term,
            examType: this.filters.examType,
            academicYear: this.filters.academicYear,
            limit: 100,
            page: 1
          }).subscribe({
            next: (data: any) => {
              if (data && data.length > 0) {
                for (const performance of data) {
                  // Convert performance.studentId to string for comparison
                  const performanceStudentId = typeof performance.studentId === 'string' 
                    ? performance.studentId 
                    : performance.studentId?._id || performance.studentId?.toString?.();
                  
                  const existingRecord = this.bulkScores.find(b => b.studentId === performanceStudentId);
                  if (existingRecord) {
                    existingRecord.score = performance.score;
                    if (performance.status) existingRecord.status = performance.status;
                  }
                }
              }
              this.loading = false;
              this.applyWorkflowStatusToBulkScores();
            },
            error: () => { this.loading = false; }
          });
        },
        error: () => { this.loading = false; }
      });
    } else if (this.filters.classId) {
      // If subject is cleared, reload all students in class
      this.onClassChange();
    }
  }

  loadPerformances() {
    this.loading = true;
    // Build filter object, excluding empty subjectId
    const filterParams: any = {
      classId: this.filters.classId,
      academicYear: this.filters.academicYear,
      term: this.filters.term,
      examType: this.filters.examType,
      limit: 500,
      page: 1
    };
    // Only include subjectId if it's not empty
    if (this.filters.subjectId) {
      filterParams.subjectId = this.filters.subjectId;
    }
    
    this.performanceService.getAll(filterParams).subscribe({
      next: (data: any) => {
        this.performances = data;
        this.loading = false;
        // Pre-fill bulk scores if data exists
        if (this.mode === 'bulk' && data.length > 0) {
          for (const p of data) {
            const existing = this.bulkScores.find(b => b.studentId === (p.studentId as any)?._id);
            if (existing) {
              existing.score = p.score;
              if (p.status) existing.status = p.status;
            }
          }
        }
      },
      error: () => { this.loading = false; },
    });
  }

  switchToBulk() {
    if (!this.filters.classId) {
      this.error = 'Please select a class first';
      return;
    }
    if (!this.filters.subjectId) {
      this.error = 'Please select a subject to enter marks';
      return;
    }
    this.error = '';
    this.mode = 'bulk';
    this.loadWorkflowOverview();
    this.onSubjectChange();
  }

  switchToView() {
    this.mode = 'view';
    this.loadPerformances();
  }  switchToOverall() {
    this.mode = 'overall';
    this.loadOverallPerformance();
  }

  get currentUserRole(): string {
    return this.currentUser?.role || this.authService.getUserRole() || '';
  }

  get isTeacher(): boolean {
    return this.currentUserRole === 'teacher';
  }

  get isClassTeacher(): boolean {
    return this.currentUserRole === 'class_teacher';
  }

  get isAdminUser(): boolean {
    return this.currentUserRole === 'admin' || this.currentUserRole === 'super_admin';
  }

  get isSuperAdmin(): boolean {
    return this.currentUserRole === 'super_admin';
  }

  loadWorkflowOverview() {
    if (!this.filters.classId) return;
    this.workflowLoading = true;
    this.performanceService.getWorkflowOverview({
      classId: this.filters.classId,
      subjectId: this.filters.subjectId,
      academicYear: this.filters.academicYear,
      term: this.filters.term,
      examType: this.filters.examType,
    }).subscribe({
      next: (data: any) => {
        this.workflowOverview = data;
        this.workflowLoading = false;
        this.applyWorkflowStatusToBulkScores();
      },
      error: () => {
        this.workflowLoading = false;
      },
    });
  }

  get currentSubjectOverview(): any {
    if (!this.workflowOverview || !this.filters.subjectId) return null;
    return this.workflowOverview.subjects?.find(
      (s: any) => s.subjectId === this.filters.subjectId
    ) || null;
  }

  get currentSubjectStatus(): string {
    const subject = this.workflowOverview?.subjects?.find(
      (s: any) => s.subjectId === this.filters.subjectId
    );
    if (!subject || subject.recordCount === 0) return this.WORKFLOW_STATUS.DRAFT;
    return subject.status || this.WORKFLOW_STATUS.DRAFT;
  }

  applyWorkflowStatusToBulkScores() {
    if (!this.workflowOverview || this.bulkScores.length === 0) return;
    const subject = this.currentSubjectOverview;
    if (!subject) return;
    this.bulkScores.forEach((entry) => {
      entry.status = subject.status;
    });
  }

  canEditBulkScores(): boolean {
    if (this.isAdminUser) return true;
    const status = this.currentSubjectStatus;
    if (this.isClassTeacher) {
      return (
        status === this.WORKFLOW_STATUS.DRAFT ||
        status === this.WORKFLOW_STATUS.RETURNED ||
        status === this.WORKFLOW_STATUS.PENDING_CLASS_TEACHER
      );
    }
    return status === this.WORKFLOW_STATUS.DRAFT || status === this.WORKFLOW_STATUS.RETURNED;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending_class_teacher: 'Pending Class Teacher',
      pending_admin: 'Pending Admin Approval',
      approved: 'Approved',
      returned: 'Returned',
    };
    return labels[status] || 'Draft';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      draft: 'bg-gray-500/10 text-gray-600 dark:text-gray-300',
      pending_class_teacher: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      pending_admin: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      returned: 'bg-red-500/10 text-red-600 dark:text-red-400',
    };
    return classes[status] || classes['draft'];
  }

  buildWorkflowFilter() {
    return {
      classId: this.filters.classId,
      subjectId: this.filters.subjectId,
      academicYear: this.filters.academicYear,
      term: this.filters.term,
      examType: this.filters.examType,
    };
  }

  submitToClassTeacher() {
    if (!this.filters.classId) {
      this.error = 'Select a class first';
      return;
    }
    if (!this.filters.subjectId) {
      this.error = 'Select a subject first';
      return;
    }
    if (!confirm('Submit these marks to the class teacher for review? They will be locked for further edits.')) return;
    this.saving = true;
    this.performanceService.submitToClassTeacher(this.buildWorkflowFilter()).subscribe({
      next: (result: any) => {
        this.saving = false;
        this.success = `Submitted ${result.count} record(s) to the class teacher.`;
        setTimeout(() => (this.success = ''), 4000);
        this.refreshAfterWorkflowAction();
      },
      error: (err: any) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to submit marks';
      },
    });
  }

  submitToAdmin() {
    if (!this.filters.classId) {
      this.error = 'Select a class first';
      return;
    }
    if (!confirm('Submit the reviewed marks to the admin for final approval?')) return;
    this.saving = true;
    this.performanceService.submitToAdmin(this.buildWorkflowFilter()).subscribe({
      next: (result: any) => {
        this.saving = false;
        this.success = `Submitted ${result.count} record(s) to the admin.`;
        setTimeout(() => (this.success = ''), 4000);
        this.refreshAfterWorkflowAction();
      },
      error: (err: any) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to submit marks';
      },
    });
  }

  approveMarks() {
    if (!this.filters.classId) {
      this.error = 'Select a class first';
      return;
    }
    if (!confirm('Approve these marks? They will be finalized and locked from further edits.')) return;
    this.saving = true;
    this.performanceService.approve(this.buildWorkflowFilter()).subscribe({
      next: (result: any) => {
        this.saving = false;
        this.success = `Approved ${result.count} record(s).`;
        setTimeout(() => (this.success = ''), 4000);
        this.refreshAfterWorkflowAction();
      },
      error: (err: any) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to approve marks';
      },
    });
  }

  returnMarks() {
    if (!this.filters.classId) {
      this.error = 'Select a class first';
      return;
    }
    const reason = prompt('Reason for returning the marks (optional):');
    if (reason === null) return;
    this.saving = true;
    this.performanceService.returnMarks({
      ...this.buildWorkflowFilter(),
      reason: reason || undefined,
    }).subscribe({
      next: (result: any) => {
        this.saving = false;
        this.success = `Returned ${result.count} record(s) for correction.`;
        setTimeout(() => (this.success = ''), 4000);
        this.refreshAfterWorkflowAction();
      },
      error: (err: any) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to return marks';
      },
    });
  }

  refreshAfterWorkflowAction() {
    this.loadWorkflowOverview();
    if (this.mode === 'bulk') {
      this.onSubjectChange();
    } else {
      this.loadPerformances();
    }
  }

  getSubjectName(subjectId: string): string {
    const subject = this.subjects.find(s => s._id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  }

  setViewSortOrder(order: 'asc' | 'desc') {
    this.viewSortOrder = order;
  }

  loadOverallPerformance() {
    if (!this.filters.classId) {
      this.error = 'Please select a class';
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    // Get all performance records for the class with strict filters: term, exam type, and year
    this.performanceService.getAll({
      classId: this.filters.classId,
      academicYear: this.filters.academicYear,
      term: this.filters.term,
      examType: this.filters.examType,
      limit: 500,
      page: 1
    }).subscribe({
      next: (data: any) => {
        this.processOverallPerformance(data);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load performance data';
        this.loading = false;
      }
    });
  }

  // Process and aggregate overall performance data
  processOverallPerformance(performances: any[]) {
    const studentMap = new Map<string, any>();
    
    performances.forEach(p => {
      const studentId = (p.studentId as any)?._id;
      const studentName = p.studentId ? `${p.studentId.firstName} ${p.studentId.lastName}` : 'Unknown';
      const admNo = p.studentId?.admissionNumber || '';
      const subjectName = p.subjectId?.name || 'Unknown Subject';
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId,
          studentName,
          admNo,
          totalSubjects: 0,
          averageScore: 0,
          subjects: [],
          scores: []
        });
      }
      
      const student = studentMap.get(studentId)!;
      
      // Only include records matching the current exam type for consistency
      if (p.examType === this.filters.examType) {
        student.subjects.push({
          name: subjectName,
          score: p.score,
          grade: this.getGradeFromScoreUsingTemplate(p.score).grade,
          remark: this.getGradeFromScoreUsingTemplate(p.score).remark,
          examType: p.examType
        });
        student.scores.push(p.score);
      }
    });
    
    // Calculate aggregates
    const overallData: any[] = Array.from(studentMap.values()).map(student => {
      const avgScore = student.scores.length > 0 
        ? (student.scores.reduce((a: number, b: number) => a + b, 0) / student.scores.length).toFixed(1)
        : 0;
      
      return {
        ...student,
        totalSubjects: student.subjects.length,
        averageScore: Number(avgScore),
        grade: this.getGradeFromScoreUsingTemplate(Number(avgScore)).grade,
        remark: this.getGradeFromScoreUsingTemplate(Number(avgScore)).remark,
        subjectsUnique: Array.from(new Set(student.subjects.map((s: any) => s.name)))
      };
    });
    
    this.overallPerformance = {
      classId: this.filters.classId,
      academicYear: this.filters.academicYear,
      term: this.filters.term,
      totalStudents: overallData.length,
      classStats: {
        averageClassScore: overallData.length > 0 ? (overallData.reduce((a, b) => a + b.averageScore, 0) / overallData.length).toFixed(1) : 0,
        topPerformers: overallData.filter(s => s.averageScore >= 80).length,
        averagePerformers: overallData.filter(s => s.averageScore >= 60 && s.averageScore < 80).length,
        needsSupport: overallData.filter(s => s.averageScore < 60).length
      },
      students: overallData,
      filters: `${this.filters.term} | ${this.filters.examType} | ${this.filters.academicYear}`
    };
  }

  getGradeFromScoreUsingTemplate(score: number): { grade: string; remark: string; points: number } {
    if (!this.gradeTemplate) {
      console.warn('⚠️ No template loaded, using default');
      return this.getGradeFromScoreDefault(score);
    }
    
    // Handle if template.grades exists, otherwise try template as array
    const gradesArray = this.gradeTemplate.grades || this.gradeTemplate;
    
    if (!gradesArray || !Array.isArray(gradesArray) || gradesArray.length === 0) {
      console.warn('⚠️ Template grades array empty, using default');
      return this.getGradeFromScoreDefault(score);
    }
    
    // Sort grades by minScore descending to check from highest to lowest
    const sortedGrades = [...gradesArray].sort((a: any, b: any) => b.minScore - a.minScore);

    // If the loaded template uses numeric-style grades (e.g. '1.0','2.0'),
    // map them to the DEFAULT_GRADES alphabet equivalents for display.
    const usesNumericGrades = sortedGrades.some(g => typeof g.grade === 'string' && /^[0-9]+(\.[0-9]+)?$/.test(g.grade));
    let displayGrades = sortedGrades;

    if (usesNumericGrades) {
      // Build a mapping from numeric template points to alphabet grades by points ordering
      const alphaGrades = DEFAULT_GRADES.slice().sort((a, b) => b.points - a.points);
      // Map highest numeric -> highest alphabet by index
      displayGrades = sortedGrades.map((g, idx) => ({
        ...g,
        displayGrade: alphaGrades[idx] ? alphaGrades[idx].grade : g.grade
      }));
    } else {
      displayGrades = sortedGrades.map(g => ({ ...g, displayGrade: g.grade }));
    }

    for (const gradeScale of displayGrades) {
      if (score >= gradeScale.minScore) {
        const shown = gradeScale.displayGrade || gradeScale.grade;
        console.log(`Score ${score} → ${shown} (${gradeScale.minScore}-${gradeScale.maxScore})`);
        return {
          grade: shown,
          remark: gradeScale.remark || '',
          points: gradeScale.points || 0
        };
      }
    }

    // Fallback to lowest grade
    const lowest = displayGrades[displayGrades.length - 1];
    return {
      grade: lowest.displayGrade || lowest.grade,
      remark: lowest.remark || '',
      points: lowest.points || 0
    };
  }

  /**
   * Fallback grade mapping using the German Grading Scale from constants
   * This is used only when the backend grading template fails to load
   */
  getGradeFromScoreDefault(score: number): { grade: string; remark: string; points: number } {
    // Use a German grading fallback scale when backend template is unavailable
    const gradesArray = GERMAN_FALLBACK_GRADES;
    const sortedGrades = [...gradesArray].sort((a: any, b: any) => b.minScore - a.minScore);
    
    for (const gradeScale of sortedGrades) {
      if (score >= gradeScale.minScore) {
        return {
          grade: gradeScale.grade,
          remark: gradeScale.remark || '',
          points: gradeScale.points || 0
        };
      }
    }
    
    // Fallback to lowest grade if score is below all ranges
    const lowestGrade = sortedGrades[sortedGrades.length - 1];
    return {
      grade: lowestGrade.grade,
      remark: lowestGrade.remark || '',
      points: lowestGrade.points || 0
    };
  }

  saveBulkScores() {
    if (!this.filters.classId || !this.filters.subjectId) {
      this.error = 'Select a class and subject';
      return;
    }
    if (!this.canEditBulkScores()) {
      this.error = 'These marks are already submitted and locked. Return them first to make changes.';
      return;
    }
    const scores = this.bulkScores
      .filter(b => b.score !== null && b.score !== undefined)
      .map(b => ({ studentId: b.studentId, score: b.score! }));

    if (scores.length === 0) {
      this.error = 'Enter at least one score';
      return;
    }

    this.saving = true;
    this.error = '';
    this.performanceService.bulkCreate({
      subjectId: this.filters.subjectId,
      classId: this.filters.classId,
      academicYear: this.filters.academicYear,
      term: this.filters.term,
      examType: this.filters.examType,
      scores,
    }).subscribe({
      next: (result: any) => {
        this.success = `Saved! ${result.created} created, ${result.updated} updated.`;
        this.saving = false;
        setTimeout(() => (this.success = ''), 4000);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to save scores';
        this.saving = false;
      },
    });
  }

  downloadExcelTemplate() {
    if (!this.filters.subjectId || this.bulkScores.length === 0) {
      this.error = 'Select a subject with students to download template';
      return;
    }

    const subjectName = this.getSubjectName(this.filters.subjectId);
    const data = this.bulkScores.map((entry, i) => ({
      '#': i + 1,
      'Admission No': entry.admNo,
      'Student Name': entry.studentName,
      [`${subjectName} Score`]: ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks');
    ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 15 }];

    XLSX.writeFile(wb, `${subjectName}_marks_template.xlsx`);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        let imported = 0;
        for (const row of rows) {
          const scoreCol = Object.keys(row).find(k => k.toLowerCase().includes('score'));
          if (!scoreCol) continue;

          const admNo = String(row['Admission No'] || row['Admission No.'] || '').trim();
          const score = Number(row[scoreCol]);

          if (admNo && !isNaN(score) && score >= 0 && score <= 100) {
            const entry = this.bulkScores.find(e => e.admNo === admNo);
            if (entry) {
              entry.score = score;
              imported++;
            }
          }
        }

        this.success = `Imported ${imported} scores from ${file.name}`;
        setTimeout(() => (this.success = ''), 4000);
      } catch (err) {
        this.error = 'Failed to parse Excel file. Ensure it matches the template format.';
      }
    };
    reader.readAsBinaryString(file);
    input.value = '';
  }

  deletePerformance(id: string) {
    if (!confirm('Delete this record?')) return;
    this.performanceService.delete(id).subscribe({
      next: () => { this.loadPerformances(); },
    });
  }

  // Group performance records by subject to avoid repetition of student names
  getGroupedPerformanceBySubject(): Array<{ subjectId: string; subjectName: string; records: any[] }> {
    const grouped = new Map<string, { subjectId: string; subjectName: string; records: any[] }>();
    
    this.performances.forEach(p => {
      const subjectId = (p.subjectId as any)?._id || p.subjectId;
      const subjectName = (p.subjectId as any)?.name || 'Unknown Subject';
      
      if (!grouped.has(subjectId)) {
        grouped.set(subjectId, {
          subjectId,
          subjectName,
          records: []
        });
      }
      
      grouped.get(subjectId)!.records.push(p);
    });
    
    // Return as array sorted by subject name
    return Array.from(grouped.values()).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }

  // Get unique subjects from performances and class subjects
  getUniqueSubjects(): Array<{ subjectId: string; name: string; code: string }> {
    const subjectsMap = new Map<string, string>();
    
    // Add all class subjects
    this.allClassSubjects.forEach(s => {
      const subjectId = s._id;
      const subjectName = s.name || 'Unknown Subject';
      if (!subjectsMap.has(subjectId)) {
        subjectsMap.set(subjectId, subjectName);
      }
    });
    
    // Also add subjects from performances (in case some aren't in allClassSubjects)
    this.performances.forEach(p => {
      const subjectId = (p.subjectId as any)?._id || p.subjectId;
      const subjectName = (p.subjectId as any)?.name || 'Unknown Subject';
      if (!subjectsMap.has(subjectId)) {
        subjectsMap.set(subjectId, subjectName);
      }
    });
    
    return Array.from(subjectsMap.entries())
      .map(([id, name]) => ({ subjectId: id, name, code: this.getSubjectCode(name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Extract subject code/abbreviation from subject name
  getSubjectCode(subjectName: string): string {
    if (!subjectName) return 'N/A';
    const abbreviations: { [key: string]: string } = {
      'CREATIVE ARTS': 'CA',
      'ENGLISH': 'ENG',
      'MATHEMATICS': 'MATH',
      'SCIENCE': 'SCI',
      'PHYSICAL AND HEALTH EDUCATION': 'PHE',
      'KISWAHILI': 'KIS',
      'SOCIAL STUDIES': 'SS',
      'BUSINESS STUDIES': 'BS',
      'COMPUTER STUDIES': 'CS',
      'ICT': 'ICT',
      'AGRICULTURE': 'AGR',
      'HOME SCIENCE': 'HS'
    };
    return abbreviations[subjectName.toUpperCase()] || subjectName.substring(0, 3).toUpperCase();
  }

  // Get student rows with their subject scores
  getStudentRows(): Array<{ studentId: string; name: string; admNo: string; studentObj: any; scoresBySubject: Map<string, number>; average: number; hasScores: boolean; gradeLabel: string | null }> {
    const studentsMap = new Map<string, { studentId: string; name: string; admNo: string; studentObj: any; scoresBySubject: Map<string, number>; scores: number[] }>();
    
    // First, populate all students from the students array
    this.students.forEach(student => {
      const studentId = student._id;
      const studentName = `${student.firstName} ${student.lastName}`;
      const admNo = student.admissionNumber || student.admNo || 'N/A';
      
      if (!studentsMap.has(studentId)) {
        studentsMap.set(studentId, {
          studentId,
          name: studentName,
          admNo,
          studentObj: student,
          scoresBySubject: new Map(),
          scores: []
        });
      }
    });
    
    // Then, populate scores from performances
    this.performances.forEach(p => {
      const studentId = (p.studentId as any)?._id || p.studentId;
      const studentName = p.studentId ? `${p.studentId.firstName} ${p.studentId.lastName}` : 'Unknown';
      const admNo = (p.studentId as any)?.admissionNumber || (p.studentId as any)?.admNo || 'N/A';
      const subjectId = (p.subjectId as any)?._id || p.subjectId;
      
      if (!studentsMap.has(studentId)) {
        studentsMap.set(studentId, {
          studentId,
          name: studentName,
          admNo,
          studentObj: p.studentId,
          scoresBySubject: new Map(),
          scores: []
        });
      }
      
      const student = studentsMap.get(studentId)!;
      student.scoresBySubject.set(subjectId, p.score);
      student.scores.push(p.score);
    });
    
    return Array.from(studentsMap.values())
      .map(student => {
        const average = student.scores.length > 0 
          ? Number((student.scores.reduce((a, b) => a + b, 0) / student.scores.length).toFixed(1))
          : 0;
        return {
          ...student,
          average,
          hasScores: student.scores.length > 0,
          gradeLabel: student.scores.length > 0 ? this.getAlphabetGradeFromScore(average) : null
        };
      })
      .sort((a, b) => {
        let compareValue = 0;

        if (this.viewSortBy === 'studentName') {
          compareValue = a.name.localeCompare(b.name);
        } else if (this.viewSortBy === 'admNo') {
          compareValue = String(a.admNo).localeCompare(String(b.admNo), undefined, { numeric: true });
        } else if (this.viewSortBy === 'average') {
          compareValue = a.average - b.average;
        }

        return this.viewSortOrder === 'asc' ? compareValue : -compareValue;
      });
  }

  // Open student details modal
  openStudentModal(student: any) {
    this.selectedStudent = student;
    this.showStudentModal = true;
  }

  // Map an average score to the default alphabetic grade scale
  getAlphabetGradeFromScore(score: number): string {
    if (typeof score !== 'number' || isNaN(score)) {
      return 'N/A';
    }

    const sortedGrades = [...DEFAULT_GRADES].sort((a, b) => b.minScore - a.minScore);
    const matched = sortedGrades.find(grade => score >= grade.minScore);
    return matched ? matched.grade : sortedGrades[sortedGrades.length - 1].grade;
  }

  onViewRecordAction(action: ActionType, student: any) {
    switch (action) {
      case 'view':
        this.openStudentModal(student);
        break;
      case 'delete':
        this.deleteStudentPerformanceRecords(student);
        break;
    }
  }

  getViewRecordActions(): { type: ActionType; tooltip: string }[] {
    return [
      { type: 'view', tooltip: 'View student details' },
      { type: 'delete', tooltip: 'Delete all student performance records' },
    ];
  }

  deleteStudentPerformanceRecords(student: any) {
    const studentId = student.studentId;
    const records = this.performances.filter(p => {
      const performanceStudentId = (p.studentId as any)?._id || p.studentId;
      return performanceStudentId === studentId;
    });

    if (records.length === 0) {
      this.error = 'No performance records found for this student.';
      return;
    }

    if (!confirm(`Delete all performance records for ${student.name}? This cannot be undone.`)) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    let completed = 0;
    let hadError = false;

    records.forEach(record => {
      if (!record._id) {
        completed += 1;
        hadError = true;
        return;
      }

      this.performanceService.delete(record._id).subscribe({
        next: () => {
          completed += 1;
          if (completed === records.length) {
            this.loading = false;
            this.loadPerformances();
            if (!hadError) {
              this.success = `Deleted ${records.length} record${records.length !== 1 ? 's' : ''} for ${student.name}.`;
              setTimeout(() => (this.success = ''), 4000);
            } else {
              this.error = 'Some records could not be deleted.';
            }
          }
        },
        error: () => {
          completed += 1;
          hadError = true;
          if (completed === records.length) {
            this.loading = false;
            this.loadPerformances();
            this.error = 'Some records could not be deleted.';
          }
        }
      });
    });
  }

  // Close student details modal
  closeStudentModal() {
    this.showStudentModal = false;
    this.selectedStudent = null;
  }
}
