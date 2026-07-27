import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassService } from '../../shared/services/class.service';
import { StudentService } from '../../shared/services/student.service';
import { SubjectService } from '../../shared/services/subject.service';
import { ThemeService } from '../../shared/services/theme.service';
import { PermissionService, SchoolPermission } from '../../shared/services/permission.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ActionButtonsComponent, ActionButton, ActionType } from '../../shared/components/action-buttons/action-buttons.component';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ActionButtonsComponent],
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.css'],
})
export class ClassesComponent implements OnInit {
  darkMode = false;
  classes: any[] = [];
  loading = false;
  showModal = false;
  editingId: string | null = null;
  error = '';
  success = '';

  // Confirm dialog
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmType: 'danger' | 'warning' | 'info' | 'success' = 'danger';
  confirmAction: (() => void) | null = null;

  // Student-Subject Assignment Modal
  showSubjectModal = false;
  selectedClass: any = null;
  classStudents: any[] = [];
  allSubjects: any[] = [];
  selectedSubjectIds: string[] = [];
  selectedSubjects: any[] = [];
  subjectEnrollments: Map<string, any[]> = new Map();
  selectedStudentIds: string[] = [];
  assigningSubjects = false;
  assignmentError = '';
  assignmentSuccess = '';
  subjectSearchText = '';
  filteredSubjects: any[] = [];

  form = { name: '', section: '', academicYear: new Date().getFullYear().toString(), teacher: '' };

  constructor(
    private classService: ClassService,
    private studentService: StudentService,
    private subjectService: SubjectService,
    private themeService: ThemeService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this.themeService.darkMode$.subscribe((d: boolean) => (this.darkMode = d));
    this.loadClasses();
  }

  loadClasses() {
    this.loading = true;
    this.classService.getAll().subscribe({
      next: (data: any) => { this.classes = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openModal(item?: any) {
    this.error = '';
    this.success = '';
    if (item) {
      if (!this.hasPermission(SchoolPermission.EDIT_CLASS)) {
        this.error = 'You do not have permission to edit classes.';
        return;
      }
      this.editingId = item._id;
      this.form = { name: item.name, section: item.section || '', academicYear: item.academicYear, teacher: item.teacher?._id || '' };
    } else {
      if (!this.hasPermission(SchoolPermission.CREATE_CLASS)) {
        this.error = 'You do not have permission to create classes.';
        return;
      }
      this.editingId = null;
      this.form = { name: '', section: '', academicYear: new Date().getFullYear().toString(), teacher: '' };
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingId = null;
  }

  save() {
    if (this.editingId && !this.hasPermission(SchoolPermission.EDIT_CLASS)) {
      this.error = 'You do not have permission to edit classes.';
      return;
    }
    if (!this.editingId && !this.hasPermission(SchoolPermission.CREATE_CLASS)) {
      this.error = 'You do not have permission to create classes.';
      return;
    }

    const data: any = { ...this.form };
    if (!data.teacher) delete data.teacher;
    if (!data.section) delete data.section;

    const obs = this.editingId
      ? this.classService.update(this.editingId, data)
      : this.classService.create(data);

    obs.subscribe({
      next: () => {
        this.success = this.editingId ? 'Class updated!' : 'Class created!';
        this.closeModal();
        this.loadClasses();
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to save class';
      },
    });
  }

  deleteClass(id: string) {
    if (!this.hasPermission(SchoolPermission.DELETE_CLASS)) {
      this.error = 'You do not have permission to delete classes.';
      this.showConfirm = false;
      return;
    }

    this.classService.delete(id).subscribe({
      next: () => {
        this.success = 'Class deleted!';
        this.loadClasses();
        this.showConfirm = false;
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (err: any) => { this.error = err.error?.message || 'Failed to delete'; this.showConfirm = false; },
    });
  }

  confirmDelete(cls: any) {
    this.confirmTitle = 'Delete Class';
    this.confirmMessage = `Delete "${cls.name}"? This cannot be undone.`;
    this.confirmType = 'danger';
    this.confirmAction = () => this.deleteClass(cls._id);
    this.showConfirm = true;
  }

  getClassActions(): ActionButton[] {
    const actions: ActionButton[] = [];
    if (this.hasPermission(SchoolPermission.EDIT_CLASS)) {
      actions.push({ type: 'edit', tooltip: 'Edit Class' });
      actions.push({ type: 'custom', label: 'Subjects', tooltip: 'Manage Student Subjects' });
    }
    if (this.hasPermission(SchoolPermission.DELETE_CLASS)) {
      actions.push({ type: 'delete', tooltip: 'Delete Class' });
    }
    return actions;
  }

  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  onClassAction(action: ActionType, cls: any) {
    switch (action) {
      case 'edit': this.openModal(cls); break;
      case 'delete': this.confirmDelete(cls); break;
      case 'custom': this.openSubjectModal(cls); break;
    }
  }

  // ===== Student-Subject Assignment Methods =====

  /**
   * Open modal to manage subjects for a class
   */
  openSubjectModal(cls: any) {
    this.selectedClass = cls;
    this.showSubjectModal = true;
    this.assignmentError = '';
    this.assignmentSuccess = '';
    this.selectedSubjectIds = [];
    this.selectedSubjects = [];
    this.subjectEnrollments.clear();
    this.selectedStudentIds = [];
    this.subjectSearchText = '';

    // Load students and subjects
    this.loadClassStudents();
    this.loadAllSubjects();
  }

  /**
   * Close subject assignment modal
   */
  closeSubjectModal() {
    this.showSubjectModal = false;
    this.selectedClass = null;
    this.selectedSubjectIds = [];
    this.selectedSubjects = [];
    this.subjectEnrollments.clear();
    this.classStudents = [];
    this.allSubjects = [];
    this.selectedStudentIds = [];
  }

  /**
   * Load all students in the class
   */
  loadClassStudents() {
    if (!this.selectedClass) return;

    this.studentService.getByClass(this.selectedClass._id).subscribe({
      next: (data: any) => {
        this.classStudents = data || [];
      },
      error: () => {
        this.assignmentError = 'Failed to load students';
      },
    });
  }

  /**
   * Load subjects for the selected class only
   */
  loadAllSubjects() {
    if (!this.selectedClass) return;
    
    this.subjectService.getAll(this.selectedClass._id).subscribe({
      next: (data: any) => {
        this.allSubjects = data || [];
        this.filteredSubjects = [...this.allSubjects];
      },
      error: () => {
        this.assignmentError = 'Failed to load subjects';
      },
    });
  }

  /**
   * Filter subjects by search text
   */
  searchSubjects() {
    if (!this.subjectSearchText.trim()) {
      this.filteredSubjects = [...this.allSubjects];
    } else {
      const searchLower = this.subjectSearchText.toLowerCase();
      this.filteredSubjects = this.allSubjects.filter((s: any) =>
        s.name?.toLowerCase().includes(searchLower) ||
        s.code?.toLowerCase().includes(searchLower)
      );
    }
  }

  /**
   * Toggle subject selection and load enrollments for selected subjects
   */
  toggleSubjectSelection(subject: any) {
    const index = this.selectedSubjectIds.indexOf(subject._id);
    if (index > -1) {
      this.selectedSubjectIds.splice(index, 1);
      this.selectedSubjects = this.selectedSubjects.filter(s => s._id !== subject._id);
    } else {
      this.selectedSubjectIds.push(subject._id);
      this.selectedSubjects.push(subject);
      if (!this.subjectEnrollments.has(subject._id)) {
        this.loadSubjectEnrollments(subject._id);
      }
    }
  }

  /**
   * Load students currently enrolled in a subject
   */
  private loadSubjectEnrollments(subjectId: string) {
    this.studentService.getByClassAndSubject(
      this.selectedClass._id,
      subjectId
    ).subscribe({
      next: (data: any) => {
        this.subjectEnrollments.set(subjectId, data || []);
      },
      error: () => {
        this.subjectEnrollments.set(subjectId, []);
      },
    });
  }

  /**
   * Toggle student selection
   */
  toggleStudent(studentId: string) {
    const index = this.selectedStudentIds.indexOf(studentId);
    if (index > -1) {
      this.selectedStudentIds.splice(index, 1);
    } else {
      this.selectedStudentIds.push(studentId);
    }
  }

  /**
   * Check if subject is selected
   */
  isSubjectSelected(subjectId: string): boolean {
    return this.selectedSubjectIds.includes(subjectId);
  }

  /**
   * Assign selected students to all selected subjects
   */
  assignStudentsToSubjects() {
    if (this.selectedSubjectIds.length === 0) {
      this.assignmentError = 'No subjects selected';
      return;
    }

    if (this.selectedStudentIds.length === 0) {
      this.assignmentError = 'No students selected';
      return;
    }

    this.assigningSubjects = true;
    this.assignmentError = '';
    this.assignmentSuccess = '';

    let completedCount = 0;
    let errorOccurred = false;

    const total = this.selectedStudentIds.length;

    this.selectedStudentIds.forEach((studentId) => {
      this.studentService.assignSubjects(
        studentId,
        this.selectedClass._id,
        this.selectedClass.academicYear,
        this.selectedSubjectIds
      ).subscribe({
        next: () => {
          completedCount++;
          if (completedCount === total) {
            this.assigningSubjects = false;
            this.selectedSubjectIds.forEach(sid => this.loadSubjectEnrollments(sid));
            this.selectedStudentIds = [];
            this.assignmentSuccess = `Assigned ${total} student(s) to ${this.selectedSubjectIds.length} subject(s)`;
            setTimeout(() => { this.assignmentSuccess = ''; }, 3000);
          }
        },
        error: (err: any) => {
          if (!errorOccurred) {
            errorOccurred = true;
            this.assignmentError = err.error?.message || 'Failed to assign students';
            this.assigningSubjects = false;
          }
        },
      });
    });
  }

  /**
   * Remove student from a subject
   */
  removeStudentFromSubject(subjectStudent: any, subjectId: string) {
    const studentName = subjectStudent.studentId?.firstName || 'Student';
    if (!confirm(`Remove ${studentName} from this subject?`)) {
      return;
    }

    this.studentService.removeFromSubject(subjectStudent._id).subscribe({
      next: () => {
        this.assignmentSuccess = 'Removed student from subject';
        // Reload enrollments for this subject
        this.loadSubjectEnrollments(subjectId);
        setTimeout(() => {
          this.assignmentSuccess = '';
        }, 2000);
      },
      error: () => {
        this.assignmentError = 'Failed to remove student from subject';
      },
    });
  }

  /**
   * Check if a student is already assigned to this subject
   */
  isStudentAssignedToSubject(studentId: string, subjectId: string): boolean {
    const enrollments = this.subjectEnrollments.get(subjectId) || [];
    return enrollments.some((e: any) => (e.studentId?._id || e.studentId) === studentId);
  }

  /**
   * Check if a student is selected
   */
  isStudentSelected(studentId: string): boolean {
    return this.selectedStudentIds.includes(studentId);
  }
}
