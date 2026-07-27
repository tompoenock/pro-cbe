import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../shared/services/student.service';
import { ClassService } from '../../shared/services/class.service';
import { UserService } from '../../shared/services/user.service';
import { ThemeService } from '../../shared/services/theme.service';
import { PermissionService, SchoolPermission } from '../../shared/services/permission.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ActionButtonsComponent, ActionButton, ActionType } from '../../shared/components/action-buttons/action-buttons.component';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ActionButtonsComponent],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css'],
})
export class StudentsComponent implements OnInit {
  darkMode = false;
  students: any[] = [];
  classes: any[] = [];
  parentUsers: any[] = [];
  loading = false;
  showModal = false;
  editingId: string | null = null;
  error = '';
  success = '';
  filterClassId = '';
  searchTerm = '';

  // Confirm dialog
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmType: 'danger' | 'warning' | 'info' | 'success' = 'danger';
  confirmAction: (() => void) | null = null;

  form = {
    firstName: '', lastName: '', admissionNumber: '', classId: '',
    dateOfBirth: '', gender: '', parentName: '', parentPhone: '', parentEmail: '', parentUserId: '',
  };

  constructor(
    private studentService: StudentService,
    private classService: ClassService,
    private userService: UserService,
    private themeService: ThemeService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this.themeService.darkMode$.subscribe((d: boolean) => (this.darkMode = d));
    this.classService.getAll().subscribe({ next: (c: any) => (this.classes = c) });
    this.userService.getAll().subscribe({ next: (users: any[]) => {
        this.parentUsers = users.filter(u => u.role === 'parent');
      }
    });
    this.loadStudents();
  }

  loadStudents() {
    this.loading = true;
    this.studentService.getAll(this.filterClassId || undefined, this.searchTerm || undefined).subscribe({
      next: (data: any) => { this.students = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openModal(item?: any) {
    this.error = '';
    if (item) {
      if (!this.hasPermission(SchoolPermission.EDIT_STUDENT)) {
        this.error = 'You do not have permission to edit student records.';
        return;
      }
      this.editingId = item._id;
      this.form = {
        firstName: item.firstName, lastName: item.lastName, admissionNumber: item.admissionNumber,
        classId: item.classId?._id || '', dateOfBirth: item.dateOfBirth ? item.dateOfBirth.substring(0, 10) : '',
        gender: item.gender || '', parentName: item.parentName || '', parentPhone: item.parentPhone || '',
        parentEmail: item.parentEmail || '', parentUserId: item.parentUserId?._id || item.parentUserId || '',
      };
    } else {
      if (!this.hasPermission(SchoolPermission.CREATE_STUDENT)) {
        this.error = 'You do not have permission to create student records.';
        return;
      }
      this.editingId = null;
      this.form = { firstName: '', lastName: '', admissionNumber: '', classId: '', dateOfBirth: '', gender: '', parentName: '', parentPhone: '', parentEmail: '', parentUserId: '' };
    }
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.editingId = null; }

  onParentSelect(userId: string) {
    const user = this.parentUsers.find(u => u._id === userId);
    if (user) {
      this.form.parentName = user.username || '';
      this.form.parentPhone = user.phone_no || '';
      this.form.parentEmail = user.email || '';
    } else {
      this.form.parentName = '';
      this.form.parentPhone = '';
      this.form.parentEmail = '';
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  save() {
    if (this.editingId && !this.hasPermission(SchoolPermission.EDIT_STUDENT)) {
      this.error = 'You do not have permission to edit student records.';
      return;
    }
    if (!this.editingId && !this.hasPermission(SchoolPermission.CREATE_STUDENT)) {
      this.error = 'You do not have permission to create student records.';
      return;
    }

    if (!this.form.parentUserId) {
      this.error = 'Please select a parent user account for this student';
      return;
    }

    const data: any = { ...this.form };
    Object.keys(data).forEach(k => { if (!data[k]) delete data[k]; });

    const obs = this.editingId
      ? this.studentService.update(this.editingId, data)
      : this.studentService.create(data);

    obs.subscribe({
      next: () => {
        this.success = this.editingId ? 'Student updated!' : 'Student created!';
        this.closeModal();
        this.loadStudents();
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (err: any) => { this.error = err.error?.message || 'Failed to save'; },
    });
  }

  deleteStudent(id: string) {
    if (!this.hasPermission(SchoolPermission.DELETE_STUDENT)) {
      this.error = 'You do not have permission to delete student records.';
      this.showConfirm = false;
      return;
    }

    this.studentService.delete(id).subscribe({
      next: () => { this.success = 'Student deleted!'; this.loadStudents(); this.showConfirm = false; setTimeout(() => (this.success = ''), 3000); },
      error: (err: any) => { this.error = err.error?.message || 'Failed to delete'; this.showConfirm = false; },
    });
  }

  confirmDelete(stu: any) {
    this.confirmTitle = 'Delete Student';
    this.confirmMessage = `Delete "${stu.firstName} ${stu.lastName}"? This cannot be undone.`;
    this.confirmType = 'danger';
    this.confirmAction = () => this.deleteStudent(stu._id);
    this.showConfirm = true;
  }

  getStudentActions(): ActionButton[] {
    const actions: ActionButton[] = [];
    if (this.hasPermission(SchoolPermission.EDIT_STUDENT)) {
      actions.push({ type: 'edit', tooltip: 'Edit Student' });
    }
    if (this.hasPermission(SchoolPermission.DELETE_STUDENT)) {
      actions.push({ type: 'delete', tooltip: 'Delete Student' });
    }
    return actions;
  }

  onStudentAction(action: ActionType, stu: any) {
    switch (action) {
      case 'edit': this.openModal(stu); break;
      case 'delete': this.confirmDelete(stu); break;
    }
  }
}
