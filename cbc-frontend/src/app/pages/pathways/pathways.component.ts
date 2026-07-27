import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PathwaysService } from './pathways.service';
import { ClassService } from '../../shared/services/class.service';
import { SubjectService } from '../../shared/services/subject.service';
import { PerformanceService } from '../../shared/services/performance.service';
import { ThemeService } from '../../shared/services/theme.service';
import { StudentService } from '../../shared/services/student.service';
import { DEFAULT_GRADES, GERMAN_FALLBACK_GRADES } from '../../shared/constants/grading.constants';

@Component({
  selector: 'app-pathways',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pathways.component.html',
  styleUrls: ['./pathways.component.scss'],
})
export class PathwaysComponent implements OnInit {
  pathways: any[] = [];
  currentStudentPathway: any = null;
  pathwayStats: any[] = [];
  pathwayTracking: any = null;
  selectedTrackingPathway: any = null;
  loading = false;
  trackingLoading = false;
  error: string | null = null;
  success: string | null = null;
  darkMode = false;

  isTeacher = false;
  isAdmin = false;
  isStudent = false;

  // View mode
  viewMode: 'overview' | 'tracking' | 'placement' = 'overview';

  // Pathway Placement Testing
  classes: any[] = [];
  selectedClass: any = null;
  selectedFilterClass: string | null = null; // For overview pathway filtering
  subjects: any[] = []; // List of available subjects
  selectedSubjects: string[] = []; // Selected subject IDs for filtering
  classStudents: any[] = [];
  studentPlacements: any[] = [];
  placementLoading = false;
  placementError: string | null = null;

  // Modal states
  showCreateModal = false;
  showEditPathwayModal = false;
  showSubjectPickerModal = false;
  showStudentContributionModal = false;
  selectedStudentContribution: any = null;
  isSubmitting = false;
  editingPathwayId: string | null = null;
  editingPathway: any = null;
  tempSelectedSubjects: string[] = [];

  // Student assignment
  allStudents: any[] = [];
  pathwayStudents: Map<string, any[]> = new Map();
  selectedStudentsForAssignment: Set<string> = new Set();

  // Form
  pathwayForm = {
    code: '',
    name: '',
    description: '',
    careerPaths: '',
    requiredCompetencies: '',
    pathwayType: 'subject-based',
    gpaRange: {
      minimumGPA: 1.0,
      maximumGPA: 5.0,
    },
    requiredSubjects: '',
  };

  trackingFilters = {
    academicYear: new Date().getFullYear().toString(),
    term: 'Term 1',
  };

  terms = ['Term 1', 'Term 2', 'Term 3'];

  private getCurrentAcademicYear(): string {
    return new Date().getFullYear().toString();
  }

  constructor(
    private pathwaysService: PathwaysService,
    private classService: ClassService,
    private subjectService: SubjectService,
    private performanceService: PerformanceService,
    private studentService: StudentService,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.themeService.darkMode$.subscribe((d: boolean) => (this.darkMode = d));
    // Check roles in ngOnInit to ensure authentication is complete
    this.isTeacher = this.checkRole('teacher');
    this.isAdmin = this.checkRole('admin');
    this.isStudent = this.checkRole('student');

    this.loadPathways();
    this.loadAllStudents();
    if (this.isStudent) {
      this.loadCurrentStudentPathway();
    }
    if (this.isTeacher || this.isAdmin) {
      this.loadPathwayStats();
      this.loadStudentPathwayMappings();
      this.loadClasses();
    }
  }

  // Load classes for pathway placement testing
  loadClasses(): void {
    this.classService.getAll().subscribe({
      next: (data: any) => {
        this.classes = data;
        console.log('Classes loaded:', this.classes);
      },
      error: (err) => {
        console.error('Error loading classes:', err);
        this.classes = [];
      },
    });
  }

  private isValidObjectId(value: string | null | undefined): boolean {
    return !!value && /^[a-fA-F0-9]{24}$/.test(value);
  }

  // Load subjects for the selected class
  loadSubjectsForClass(): void {
    if (!this.selectedClass) {
      this.subjects = [];
      this.selectedSubjects = [];
      return;
    }

    if (!this.isValidObjectId(this.selectedClass._id)) {
      this.subjects = [];
      this.selectedSubjects = [];
      this.placementError = 'Select a real class before loading subjects.';
      return;
    }

    this.subjectService.getAll(this.selectedClass._id).subscribe({
      next: (data: any) => {
        this.subjects = data || [];
        this.selectedSubjects = this.subjects.map((subject: any) => subject._id);
        console.log(`Loaded ${this.subjects.length} subjects for class ${this.selectedClass.name}`);
      },
      error: (err) => {
        console.error('Error loading subjects for class:', err);
        this.subjects = [];
        this.selectedSubjects = [];
      },
    });
  }

  // Handle subject selection changes
  onSubjectSelectionChange(): void {
    // When subjects are changed, reload placements if class is selected
    if (!this.selectedSubjects || this.selectedSubjects.length === 0) {
      // Default to all subjects if none selected
      this.selectedSubjects = this.subjects.map((subject) => subject._id);
    }
    if (this.selectedClass) {
      this.loadPlacementForClass();
    }
  }

  onSelectedClassChange(selectedClass: any): void {
    this.selectedClass = selectedClass;
    if (selectedClass) {
      this.loadSubjectsForClass();
    } else {
      this.subjects = [];
      this.selectedSubjects = [];
      this.studentPlacements = [];
    }
  }

  openSubjectPickerModal(): void {
    this.tempSelectedSubjects = [...this.selectedSubjects];
    this.showSubjectPickerModal = true;
  }

  closeSubjectPickerModal(): void {
    this.showSubjectPickerModal = false;
    this.tempSelectedSubjects = [];
  }

  toggleSubjectSelection(subjectId: string): void {
    const index = this.tempSelectedSubjects.indexOf(subjectId);
    if (index === -1) {
      this.tempSelectedSubjects.push(subjectId);
    } else {
      this.tempSelectedSubjects.splice(index, 1);
    }
  }

  saveSubjectSelection(): void {
    if (!this.tempSelectedSubjects || this.tempSelectedSubjects.length === 0) {
      this.selectedSubjects = this.subjects.map((subject) => subject._id);
    } else {
      this.selectedSubjects = [...this.tempSelectedSubjects];
    }

    this.showSubjectPickerModal = false;
    this.loadStudentsForPlacement();
  }

  resetSubjectSelection(): void {
    this.tempSelectedSubjects = [];
  }

  openStudentContributionModal(placement: any): void {
    const selectedSet = new Set(this.selectedSubjects || []);
    const contributions = (placement.subjectContributions || []).filter((sc: any) => {
      if (!selectedSet || selectedSet.size === 0) return true;
      return selectedSet.has(sc.subjectId);
    });

    this.selectedStudentContribution = { ...placement, subjectContributions: contributions };
    this.showStudentContributionModal = true;
  }

  closeStudentContributionModal(): void {
    this.showStudentContributionModal = false;
    this.selectedStudentContribution = null;
  }


  // Switch view mode
  switchViewMode(mode: 'overview' | 'tracking' | 'placement'): void {
    this.viewMode = mode;
    if (mode === 'placement' && this.pathways.length > 0) {
      // Reset placement data when switching to placement mode
      this.selectedClass = null;
      this.classStudents = [];
      this.studentPlacements = [];
    }
  }

  // Load student placements for a selected class
  loadPlacementForClass(): void {
    if (!this.selectedClass) {
      this.placementError = 'Please select a class';
      return;
    }

    this.placementLoading = true;
    this.placementError = null;
    this.studentPlacements = [];

    this.subjectService.getAll(this.selectedClass._id).subscribe({
      next: (data: any) => {
        this.subjects = data || [];
        if (!this.selectedSubjects || this.selectedSubjects.length === 0) {
          this.selectedSubjects = this.subjects.map((subject: any) => subject._id);
        } else {
          const availableIds = new Set(this.subjects.map((subject: any) => subject._id));
          this.selectedSubjects = this.selectedSubjects.filter((subjectId) => availableIds.has(subjectId));
        }
        this.loadStudentsForPlacement();
      },
      error: (err: any) => {
        console.error('Error loading subjects for class:', err);
        this.subjects = [];
        this.selectedSubjects = [];
        this.placementError = 'Failed to load class subjects';
        this.placementLoading = false;
      },
    });
  }

  private loadStudentsForPlacement(): void {
    if (!this.selectedClass) {
      this.placementError = 'Please select a class';
      this.placementLoading = false;
      return;
    }

    this.studentService.getByClass(this.selectedClass._id).subscribe({
      next: (students: any) => {
        this.classStudents = students;
        // Load performance data for each student
        this.loadStudentPerformanceForPlacement(students);
      },
      error: (err: any) => {
        this.placementError = 'Failed to load students';
        this.placementLoading = false;
        console.error('Error loading class students:', err);
      },
    });
  }

  // Load performance and calculate pathway recommendations
  loadStudentPerformanceForPlacement(students: any[]): void {
    this.performanceService.getAll({
      classId: this.selectedClass._id,
      academicYear: new Date().getFullYear().toString(),
      limit: 500,
      page: 1,
    }).subscribe({
      next: (performances: any[]) => {
        const filteredPerformances = this.filterPerformancesBySelectedSubjects(performances);
        // Process student performances and calculate placements
        this.calculateStudentPlacements(students, filteredPerformances);
        this.placementLoading = false;
      },
      error: (err: any) => {
        this.placementError = 'Failed to load performance data';
        this.placementLoading = false;
        console.error('Error loading performance:', err);
      },
    });
  }

  // Calculate pathway placements based on performance
  calculateStudentPlacements(students: any[], performances: any[]): void {
    const studentPerformanceMap = new Map<string, any[]>();

    performances.forEach((perf: any) => {
      const studentId = this.getStudentIdFromPerformance(perf);
      if (!studentId) return;
      if (!studentPerformanceMap.has(studentId)) {
        studentPerformanceMap.set(studentId, []);
      }
      studentPerformanceMap.get(studentId)!.push(perf);
    });

    this.studentPlacements = students.map((student: any) => {
      const studentPerfs = studentPerformanceMap.get(student._id) || [];
      const totalMarks = studentPerfs.reduce((sum, perf) => sum + (perf.score || 0), 0);
      const averageScore = studentPerfs.length > 0
        ? totalMarks / studentPerfs.length
        : 0;
      const gpa = averageScore / 20; // Standardized: 0-5.0 scale

      const subjectContributionMap = new Map<string, { subjectId: string; subjectName: string; totalMarks: number; count: number }>();
      studentPerfs.forEach((perf: any) => {
        const subjectName = this.getPerformanceSubjectName(perf);
        const subjectId = this.getPerformanceSubjectId(perf) || subjectName;
        const existing = subjectContributionMap.get(subjectId) || { subjectId, subjectName, totalMarks: 0, count: 0 };
        existing.totalMarks += perf.score || 0;
        existing.count += 1;
        subjectContributionMap.set(subjectId, existing);
      });

      const subjectContributions = Array.from(subjectContributionMap.values()).map((entry) => ({
        subjectId: entry.subjectId,
        subjectName: entry.subjectName,
        averageMarks: entry.count > 0 ? entry.totalMarks / entry.count : 0,
      }));

      const matchedPathway = this.findMatchingPathway(gpa, studentPerfs.length);

      return {
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        averageScore: parseFloat(averageScore.toFixed(2)),
        gpa: parseFloat(gpa.toFixed(2)),
        performanceCount: studentPerfs.length,
        recommendedPathway: matchedPathway,
        grade: this.getGradeFromScore(averageScore),
        subjectContributions,
      };
    }).sort((a, b) => b.gpa - a.gpa);
  }

  // Find matching pathway based on GPA (standardized 0-5.0 scale)
  findMatchingPathway(gpa: number, performanceCount: number): any {
    if (performanceCount === 0) {
      return { name: 'No performance data', code: 'N/A', gpaRange: null };
    }

    const sortedPathways = [...this.pathways].sort((a, b) => {
      const bMin = b.gpaRange?.minimumGPA ?? b.minimumGPA ?? 0;
      const aMin = a.gpaRange?.minimumGPA ?? a.minimumGPA ?? 0;
      return bMin - aMin;
    });

    for (const pathway of sortedPathways) {
      const minGpa = pathway.gpaRange?.minimumGPA ?? pathway.minimumGPA ?? 0;
      const maxGpa = pathway.gpaRange?.maximumGPA ?? null;

      if (gpa < minGpa) {
        continue;
      }
      if (maxGpa !== null && maxGpa !== undefined && gpa > maxGpa) {
        continue;
      }
      return pathway;
    }

    return { name: 'No matching pathway', code: 'N/A', gpaRange: null };
  }

  // Get grade from score using the configured/default letter-based grading scale
  getGradeFromScore(score: number): string {
    const sortedGrades = [...DEFAULT_GRADES].sort((a, b) => b.minScore - a.minScore);
    for (const gradeScale of sortedGrades) {
      if (score >= gradeScale.minScore) {
        return gradeScale.grade;
      }
    }
    return sortedGrades[sortedGrades.length - 1].grade;
  }

  getStudentIdFromPerformance(perf: any): string | null {
    return (perf.studentId as any)?._id || perf.studentId || null;
  }

  getPerformanceSubjectId(perf: any): string | null {
    return (perf.subjectId as any)?._id || perf.subjectId || null;
  }

  getPerformanceSubjectName(perf: any): string {
    return (perf.subjectId as any)?.name || perf.subjectName || (perf.subjectId as any)?.code || 'Unknown Subject';
  }

  filterPerformancesBySelectedSubjects(performances: any[]): any[] {
    if (!this.selectedSubjects || this.selectedSubjects.length === 0) {
      return performances;
    }

    const selectedSet = new Set(this.selectedSubjects);
    return performances.filter((perf: any) => {
      const subjectId = this.getPerformanceSubjectId(perf);
      return subjectId ? selectedSet.has(subjectId) : false;
    });
  }

  getSelectedSubjectNames(): string[] {
    return this.subjects
      .filter((subject) => this.selectedSubjects.includes(subject._id))
      .map((subject) => subject.name);
  }

  loadPathways(): void {
    this.loading = true;
    this.error = null;
    this.pathwaysService.getActivePathways().subscribe({
      next: (data) => {
        this.pathways = data;
        this.loading = false;
        if ((this.isTeacher || this.isAdmin) && data.length > 0 && !this.selectedTrackingPathway) {
          this.loadPathwayTracking(data[0]);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load pathways. Please try again.';
        this.loading = false;
        console.error('Error loading pathways:', err);
      },
    });
  }

  loadCurrentStudentPathway(): void {
    const studentId = this.getStudentIdFromSession();
    if (!studentId) return;

    this.pathwaysService.getStudentPathway(studentId).subscribe({
      next: (data) => {
        this.currentStudentPathway = data;
      },
      error: (err) => {
        console.error('Error loading student pathway:', err);
      },
    });
  }

  loadPathwayStats(): void {
    this.pathwaysService.getPathwayDistribution().subscribe({
      next: (data) => {
        this.pathwayStats = data;
      },
      error: (err) => {
        console.error('Error loading pathway stats:', err);
      },
    });
  }

  loadPathwayTracking(pathway: any): void {
    if (!pathway?._id) return;

    this.selectedTrackingPathway = pathway;
    this.pathwayTracking = null;
    this.trackingLoading = true;

    this.pathwaysService.getPathwayTracking(
      pathway._id,
      this.trackingFilters.academicYear,
      this.trackingFilters.term,
    ).subscribe({
      next: (data) => {
        this.pathwayTracking = data;
        this.trackingLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load pathway tracking';
        this.trackingLoading = false;
        console.error('Error loading pathway tracking:', err);
      },
    });
  }

  refreshPathwayTracking(): void {
    if (this.selectedTrackingPathway) {
      this.loadPathwayTracking(this.selectedTrackingPathway);
    }
  }

  resetTrackingYearToCurrent(): void {
    this.trackingFilters.academicYear = this.getCurrentAcademicYear();
    this.refreshPathwayTracking();
  }

  getTrackingAverageColor(score: number): string {
    if (score >= 70) return 'bg-green-100 text-green-700';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  }

  getPercentage(count: number): number {
    if (this.pathwayStats.length === 0) return 0;
    const total = this.pathwayStats.reduce((sum, stat) => sum + stat.studentCount, 0);
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  // Modal methods
  openCreateModal(): void {
    this.error = null;
    this.success = null;
    this.editingPathwayId = null;
    this.pathwayForm = {
      code: '',
      name: '',
      description: '',
      careerPaths: '',
      requiredCompetencies: '',
      pathwayType: 'subject-based',
      gpaRange: {
        minimumGPA: 1.0,
        maximumGPA: 5.0,
      },
      requiredSubjects: '',
    };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  savePathway(): void {
    if (!this.validateForm()) return;

    // Clean gpaRange to only include valid DTO fields (exclude _id)
    const gpaRange = {
      minimumGPA: this.pathwayForm.gpaRange.minimumGPA,
      maximumGPA: this.pathwayForm.gpaRange.maximumGPA,
    };

    const data = {
      code: this.pathwayForm.code,
      name: this.pathwayForm.name,
      description: this.pathwayForm.description,
      pathwayType: this.pathwayForm.pathwayType,
      gpaRange: gpaRange,
      careerPaths: this.pathwayForm.careerPaths
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p),
      requiredCompetencies: this.pathwayForm.requiredCompetencies
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c),
      requiredSubjects: this.pathwayForm.requiredSubjects
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s),
    };

    this.isSubmitting = true;
    this.error = null;

    const obs = this.editingPathwayId
      ? this.pathwaysService.updatePathway(this.editingPathwayId, data)
      : this.pathwaysService.createPathway(data);

    obs.subscribe({
      next: () => {
        this.success = this.editingPathwayId ? 'Pathway updated!' : 'Pathway created!';
        this.closeCreateModal();
        this.loadPathways();
        this.isSubmitting = false;
        setTimeout(() => (this.success = null), 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to save pathway';
        this.isSubmitting = false;
        console.error('Error saving pathway:', err);
      },
    });
  }

  validateForm(): boolean {
    if (!this.pathwayForm.code.trim()) {
      this.error = 'Pathway code is required';
      return false;
    }
    if (!this.pathwayForm.name.trim()) {
      this.error = 'Pathway name is required';
      return false;
    }
    if (!this.pathwayForm.description.trim()) {
      this.error = 'Description is required';
      return false;
    }
    if (this.pathwayForm.gpaRange.minimumGPA < 0 || this.pathwayForm.gpaRange.minimumGPA > 5.0) {
      this.error = 'Minimum GPA must be between 0 and 5.0';
      return false;
    }
    if (this.pathwayForm.gpaRange.maximumGPA < 0 || this.pathwayForm.gpaRange.maximumGPA > 5.0) {
      this.error = 'Maximum GPA must be between 0 and 5.0';
      return false;
    }
    if (this.pathwayForm.gpaRange.minimumGPA > this.pathwayForm.gpaRange.maximumGPA) {
      this.error = 'Minimum GPA cannot be greater than Maximum GPA';
      return false;
    }
    return true;
  }

  checkRole(role: string): boolean {
    // Check both localStorage and sessionStorage for user role
    const userRoleRaw = localStorage.getItem('role') || sessionStorage.getItem('userRole') || '';
    const normalized = userRoleRaw.toLowerCase().replace(/[_\s-]/g, '');
    const target = role.toLowerCase();
    return normalized === target || normalized === 'admin' || normalized === 'superadmin';
  }

  getStudentIdFromSession(): string | null {
    return sessionStorage.getItem('studentId');
  }

  // Student Assignment Methods
  openEditPathwayModal(pathway: any): void {
    this.editingPathway = pathway;
    this.showEditPathwayModal = true;
    this.selectedStudentsForAssignment.clear();
    
    // Load all students if not already loaded
    if (this.allStudents.length === 0) {
      this.loadAllStudents();
    }
    
    // Mark currently assigned students
    const currentStudents = this.getStudentsInPathway(pathway._id);
    currentStudents.forEach(student => {
      this.selectedStudentsForAssignment.add(student._id);
    });
  }

  closeEditPathwayModal(): void {
    this.showEditPathwayModal = false;
    this.editingPathway = null;
    this.selectedStudentsForAssignment.clear();
  }

  loadAllStudents(): void {
    this.pathwaysService.getAllStudents().subscribe({
      next: (data) => {
        // Handle both array and paginated response
        this.allStudents = Array.isArray(data) ? data : (data.data || []);
        console.log(`Loaded ${this.allStudents.length} students`);
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.allStudents = [];
      },
    });
  }

  loadStudentPathwayMappings(): void {
    // Load students for each pathway from performance-based placements
    if (!this.pathways || this.pathways.length === 0) return;

    // Load all classes and calculate pathway placements for each
    this.classService.getAll().subscribe({
      next: (classes: any[]) => {
        let completedClasses = 0;
        const totalClasses = classes.length;

        classes.forEach((classData) => {
          // Get students in this class
          this.studentService.getByClass(classData._id).subscribe({
            next: (students: any) => {
              // Load performance data for the class
              this.performanceService.getAll({
                classId: classData._id,
                academicYear: new Date().getFullYear().toString(),
                limit: 500,
                page: 1,
              }).subscribe({
                next: (performances: any[]) => {
                  // Calculate placements and update pathway students
                  this.calculateAndMapStudentPlacements(students, performances);
                  completedClasses++;
                  
                  if (completedClasses === totalClasses) {
                    console.log('Pathway student mappings loaded from performance data');
                  }
                },
                error: (err) => {
                  completedClasses++;
                  console.error('Error loading performance for class:', err);
                },
              });
            },
            error: (err) => {
              completedClasses++;
              console.error(`Error loading students for class ${classData._id}:`, err);
            },
          });
        });
      },
      error: (err) => {
        console.error('Error loading classes for pathway mappings:', err);
      },
    });
  }

  // Calculate placements and map students to pathways
  calculateAndMapStudentPlacements(students: any[], performances: any[]): void {
    // Create a map of student performance by studentId
    const studentPerformanceMap = new Map<string, any[]>();
    
    performances.forEach((perf) => {
      const studentId = perf.studentId || perf.student?._id;
      if (studentId) {
        if (!studentPerformanceMap.has(studentId)) {
          studentPerformanceMap.set(studentId, []);
        }
        studentPerformanceMap.get(studentId)!.push(perf);
      }
    });

    // Calculate pathway for each student
    students.forEach((student) => {
      const studentPerfs = studentPerformanceMap.get(student._id);
      if (studentPerfs && studentPerfs.length > 0) {
        // Calculate GPA and get recommended pathway
        const gpa = this.calculateStudentGPA(studentPerfs);
        const recommendedPathway = this.getRecommendedPathway(gpa, studentPerfs);

        if (recommendedPathway) {
          // Add student to the pathway
          const currentStudents = this.pathwayStudents.get(recommendedPathway._id) || [];
          // Check if student already exists
          if (!currentStudents.find(s => s._id === student._id)) {
            currentStudents.push({
              ...student,
              gpa,
              recommendedPathway,
            });
            this.pathwayStudents.set(recommendedPathway._id, currentStudents);
          }
        }
      }
    });
  }

  // Calculate student GPA from performance data (standardized 0-5.0 scale)
  calculateStudentGPA(performances: any[]): number {
    if (!performances || performances.length === 0) return 0;
    
    const totalMarks = performances.reduce((sum, perf) => sum + (perf.marks || 0), 0);
    const averageMarks = totalMarks / performances.length;
    
    return averageMarks / 20;
  }

  // Get recommended pathway based on GPA and performance
  getRecommendedPathway(gpa: number, performances: any[]): any {
    if (!this.pathways || this.pathways.length === 0) return null;

    // Get subject names from performance data
    const subjects = new Set(performances.map((p) => p.subject?.name || p.subjectName).filter(Boolean));

    // Find pathway that matches subjects and GPA range
    for (const pathway of this.pathways) {
      const minGpa = pathway.gpaRange?.minimumGPA ?? pathway.minimumGPA ?? 0;
      const maxGpa = pathway.gpaRange?.maximumGPA ?? null;

      // Check if GPA meets range requirements
      if (gpa < minGpa) {
        continue;
      }
      if (maxGpa !== null && maxGpa !== undefined && gpa > maxGpa) {
        continue;
      }

      // Check if student has required subjects
      const hasRequiredSubjects = pathway.requiredSubjects && pathway.requiredSubjects.length > 0
        ? pathway.requiredSubjects.some((reqSubject: any) => {
            const subjectName = typeof reqSubject === 'string' ? reqSubject : reqSubject.name;
            return subjects.has(subjectName);
          })
        : true; // If no specific subjects required, pathway is suitable

      if (hasRequiredSubjects) {
        return pathway;
      }
    }

    // If no matching pathway, return the one with lowest minimum GPA requirement
    return this.pathways.reduce((prev, curr) => 
      (curr.minimumGPA || 0) < (prev.minimumGPA || 0) ? curr : prev
    );
  }

  getStudentsInPathway(pathwayId: string): any[] {
    return this.pathwayStudents.get(pathwayId) || [];
  }

  // Get students in pathway filtered by selected class
  getStudentsInPathwayByClass(pathwayId: string): any[] {
    const allStudents = this.getStudentsInPathway(pathwayId);
    
    // If no class filter selected, return all students
    if (!this.selectedFilterClass) {
      return allStudents;
    }
    
    // Filter students by the selected class
    return allStudents.filter(student => {
      return student.classId === this.selectedFilterClass || student.class === this.selectedFilterClass;
    });
  }

  // Handle class filter change
  onClassFilterChange(): void {
    // This will trigger change detection and update the student counts
    // Force component to refresh the display
    this.pathwayStudents = new Map(this.pathwayStudents);
  }

  isStudentAssigned(studentId: string): boolean {
    return this.selectedStudentsForAssignment.has(studentId);
  }

  toggleStudentAssignment(student: any): void {
    if (this.selectedStudentsForAssignment.has(student._id)) {
      this.selectedStudentsForAssignment.delete(student._id);
    } else {
      this.selectedStudentsForAssignment.add(student._id);
    }
  }

  unassignStudent(studentId: string): void {
    this.selectedStudentsForAssignment.delete(studentId);
  }

  savePathwayAssignments(): void {
    if (!this.editingPathway) return;

    this.isSubmitting = true;
    this.error = null;

    // Convert Set to Array for API call
    const studentIds = Array.from(this.selectedStudentsForAssignment);

    this.pathwaysService.assignStudentsToPathway(this.editingPathway._id, studentIds).subscribe({
      next: () => {
        // Update the local map with newly assigned students
        this.pathwayStudents.set(
          this.editingPathway._id,
          this.allStudents.filter(s => this.selectedStudentsForAssignment.has(s._id))
        );

        this.success = 'Students assigned successfully!';
        this.isSubmitting = false;
        setTimeout(() => {
          this.success = null;
          this.closeEditPathwayModal();
        }, 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to assign students';
        this.isSubmitting = false;
        console.error('Error assigning students:', err);
      },
    });
  }

  // GPA and Recommendation Methods

  studentGPA: any = null;
  showGPAModal = false;
  pathwayRecommendations: any = null;
  showRecommendationsModal = false;
  recommendationsLoading = false;
  autoPlacingStudent = false;

  loadStudentGPA(studentId?: string): void {
    const id = studentId || this.getStudentIdFromSession();
    if (!id) {
      this.error = 'Student ID not found';
      return;
    }

    this.loading = true;
    this.pathwaysService.calculateStudentGPA(id, this.trackingFilters.academicYear, this.trackingFilters.term).subscribe({
      next: (data) => {
        this.studentGPA = data;
        this.showGPAModal = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to calculate GPA';
        this.loading = false;
      },
    });
  }

  getPathwayRecommendations(studentId?: string): void {
    const id = studentId || this.getStudentIdFromSession();
    if (!id) {
      this.error = 'Student ID not found';
      return;
    }

    this.recommendationsLoading = true;
    this.pathwaysService.getPathwayRecommendations(id, this.trackingFilters.academicYear, this.trackingFilters.term).subscribe({
      next: (data) => {
        this.pathwayRecommendations = data;
        this.showRecommendationsModal = true;
        this.recommendationsLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to get recommendations';
        this.recommendationsLoading = false;
      },
    });
  }

  autoPlaceStudentInPathway(studentId?: string): void {
    const id = studentId || this.getStudentIdFromSession();
    if (!id) {
      this.error = 'Student ID not found';
      return;
    }

    if (!confirm('Auto-place this student in the best recommended pathway?')) {
      return;
    }

    this.autoPlacingStudent = true;
    this.pathwaysService.autoPlaceStudent(id, this.trackingFilters.academicYear, this.trackingFilters.term).subscribe({
      next: (data) => {
        this.success = `Student auto-placed in pathway: ${data.selectedPathway.name}`;
        this.loadPathways();
        this.loadCurrentStudentPathway();
        this.autoPlacingStudent = false;
        setTimeout(() => (this.success = null), 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to auto-place student';
        this.autoPlacingStudent = false;
      },
    });
  }

  closeGPAModal(): void {
    this.showGPAModal = false;
  }

  closeRecommendationsModal(): void {
    this.showRecommendationsModal = false;
  }

  getGroupedPathways(groupedMap: any): any[] {
    const result = [];
    for (const [name, pathways] of Object.entries(groupedMap) || []) {
      result.push({
        name,
        pathways: pathways as any[],
      });
    }
    return result;
  }

  selectPathway(pathway: any): void {
    if (!this.isStudent) {
      this.error = 'Only students can select pathways';
      return;
    }

    const studentId = this.getStudentIdFromSession();
    if (!studentId) {
      this.error = 'Student ID not found in session';
      return;
    }

    const assignmentData: any = {
      pathwayId: pathway._id || pathway.id,
      notes: 'Selected by student based on recommendations',
    };

    this.loading = true;
    this.pathwaysService.assignPathwayToStudent(
      pathway._id || pathway.id,
      studentId,
      assignmentData.notes,
    ).subscribe({
      next: () => {
        this.success = `Successfully selected ${pathway.name} pathway!`;
        this.loadCurrentStudentPathway();
        this.loading = false;
        this.closeRecommendationsModal();
        setTimeout(() => (this.success = null), 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to select pathway';
        this.loading = false;
      },
    });
  }

  // Edit pathway details
  editPathwayDetails(pathway: any): void {
    this.editingPathwayId = pathway._id;
    
    // Clean gpaRange to exclude MongoDB _id field
    const cleanGpaRange = pathway.gpaRange 
      ? {
          minimumGPA: pathway.gpaRange.minimumGPA,
          maximumGPA: pathway.gpaRange.maximumGPA,
        }
      : {
          minimumGPA: 1.0,
          maximumGPA: 5.0,
        };
    
    this.pathwayForm = {
      code: pathway.code,
      name: pathway.name,
      description: pathway.description,
      careerPaths: pathway.careerPaths.join(', '),
      requiredCompetencies: pathway.requiredCompetencies.join(', '),
      pathwayType: pathway.pathwayType || 'subject-based',
      gpaRange: cleanGpaRange,
      requiredSubjects: pathway.requiredSubjects?.join(', ') || '',
    };
    this.error = null;
    this.success = null;
    this.showCreateModal = true;
  }

  // Delete pathway with confirmation
  confirmDeletePathway(pathway: any): void {
    if (!confirm(`Are you sure you want to delete the pathway "${pathway.name}"? This action cannot be undone.`)) {
      return;
    }

    this.deletePathway(pathway._id);
  }

  // Delete pathway
  deletePathway(pathwayId: string): void {
    this.loading = true;
    this.error = null;
    
    this.pathwaysService.deletePathway(pathwayId).subscribe({
      next: () => {
        this.success = 'Pathway deleted successfully!';
        this.loading = false;
        this.loadPathways();
        setTimeout(() => (this.success = null), 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete pathway';
        this.loading = false;
        console.error('Error deleting pathway:', err);
      },
    });
  }
}

