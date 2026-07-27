import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectService } from '../../shared/services/subject.service';
import { ClassService } from '../../shared/services/class.service';
import { StaffService } from '../../shared/services/staff.service';
import { ThemeService } from '../../shared/services/theme.service';
import { PermissionService, SchoolPermission } from '../../shared/services/permission.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ActionButtonsComponent, ActionButton, ActionType } from '../../shared/components/action-buttons/action-buttons.component';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ActionButtonsComponent],
  templateUrl: './subjects.component.html',
  styleUrls: ['./subjects.component.css'],
})
export class SubjectsComponent implements OnInit {
  darkMode = false;
  subjects: any[] = [];
  classes: any[] = [];
  teachers: any[] = [];
  loading = false;
  showModal = false;
  editingId: string | null = null;
  error = '';
  success = '';
  filterClassId = '';

  // Confirm dialog
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmType: 'danger' | 'warning' | 'info' | 'success' = 'danger';
  confirmAction: (() => void) | null = null;
  showSeedModal = false;
  seedCategory = '';
  seedClassId = '';

  readonly seedCategories = [
    { value: 'lowerPrimary', label: 'Lower Primary' },
    { value: 'upperPrimary', label: 'Upper Primary' },
    { value: 'juniorSecondary', label: 'Junior Secondary' },
    { value: 'secondary', label: 'Secondary' },
  ];

  form = { name: '', code: '', classId: '', teacher: '' };
  readonly SchoolPermission = SchoolPermission;

  constructor(
    private subjectService: SubjectService,
    private classService: ClassService,
    private staffService: StaffService,
    private themeService: ThemeService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this.themeService.darkMode$.subscribe((d: boolean) => (this.darkMode = d));
    this.classService.getAll().subscribe({ next: (c: any) => (this.classes = c) });
    this.staffService.getTeachers().subscribe({ next: (t: any) => (this.teachers = t) });
    this.loadSubjects();
  }

  loadSubjects() {
    this.loading = true;
    this.subjectService.getAll(this.filterClassId || undefined).subscribe({
      next: (data: any) => { this.subjects = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  get totalSubjectsCount(): number {
    return this.subjects.length;
  }

  get assignedSubjectsCount(): number {
    return this.subjects.filter((subject) => !!subject.teacher).length;
  }

  get unassignedSubjectsCount(): number {
    return this.totalSubjectsCount - this.assignedSubjectsCount;
  }

  get classesWithSubjectsCount(): number {
    return new Set(this.subjects.map((subject) => subject.classId?._id || subject.classId || subject.classId?.name).filter(Boolean)).size;
  }

  get selectedClassLabel(): string {
    if (!this.filterClassId) {
      return 'All classes';
    }

    const selectedClass = this.classes.find((cls) => cls._id === this.filterClassId);
    return selectedClass ? `${selectedClass.name}${selectedClass.section ? ` (${selectedClass.section})` : ''}` : 'Selected class';
  }

  openModal(item?: any) {
    this.error = '';
    if (item) {
      if (!this.hasPermission(SchoolPermission.EDIT_SUBJECT)) {
        this.error = 'You do not have permission to edit subjects.';
        return;
      }
      this.editingId = item._id;
      this.form = { name: item.name, code: item.code, classId: item.classId?._id || '', teacher: item.teacher?._id || '' };
    } else {
      if (!this.hasPermission(SchoolPermission.CREATE_SUBJECT)) {
        this.error = 'You do not have permission to create subjects.';
        return;
      }
      this.editingId = null;
      this.form = { name: '', code: '', classId: '', teacher: '' };
    }
    this.showModal = true;
  }

  confirmSeedCBESubjects(): void {
    this.seedCategory = '';
    this.seedClassId = '';
    this.error = '';
    this.showSeedModal = true;
  }

  onSeedCategoryChange(): void {
    this.seedClassId = '';
  }

  getSeedClassOptions(): any[] {
    return this.classes;
  }

  runSeedCBESubjects(): void {
    this.loading = true;
    this.error = '';

    this.subjectService.seedCBESubjects(this.seedClassId || undefined, this.seedCategory || undefined).subscribe({
      next: (result) => {
        this.success = `Seeded ${result.subjectsUpserted} subjects across ${result.classesProcessed} classes.`;
        this.showSeedModal = false;
        this.loadSubjects();
        setTimeout(() => (this.success = ''), 4000);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to seed CBE subjects';
        this.showSeedModal = false;
        this.loading = false;
      },
    });
  }

  closeSeedModal(): void {
    this.showSeedModal = false;
    this.seedCategory = '';
    this.seedClassId = '';
  }

  closeModal() { this.showModal = false; this.editingId = null; }

  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  save() {
    if (this.editingId && !this.hasPermission(SchoolPermission.EDIT_SUBJECT)) {
      this.error = 'You do not have permission to edit subjects.';
      return;
    }
    if (!this.editingId && !this.hasPermission(SchoolPermission.CREATE_SUBJECT)) {
      this.error = 'You do not have permission to create subjects.';
      return;
    }

    const data: any = { ...this.form };
    if (!data.classId) delete data.classId;
    if (!data.teacher) delete data.teacher;

    const obs = this.editingId
      ? this.subjectService.update(this.editingId, data)
      : this.subjectService.create(data);

    obs.subscribe({
      next: () => {
        this.success = this.editingId ? 'Subject updated!' : 'Subject created!';
        this.closeModal();
        this.loadSubjects();
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (err: any) => { this.error = err.error?.message || 'Failed to save'; },
    });
  }

  deleteSubject(id: string) {
    if (!this.hasPermission(SchoolPermission.DELETE_SUBJECT)) {
      this.error = 'You do not have permission to delete subjects.';
      this.showConfirm = false;
      return;
    }

    this.subjectService.delete(id).subscribe({
      next: () => { this.success = 'Subject deleted!'; this.loadSubjects(); this.showConfirm = false; setTimeout(() => (this.success = ''), 3000); },
      error: (err: any) => { this.error = err.error?.message || 'Failed to delete'; this.showConfirm = false; },
    });
  }

  confirmDelete(subj: any) {
    this.confirmTitle = 'Delete Subject';
    this.confirmMessage = `Delete "${subj.name}"? This cannot be undone.`;
    this.confirmType = 'danger';
    this.confirmAction = () => this.deleteSubject(subj._id);
    this.showConfirm = true;
  }

  getSubjectActions(): ActionButton[] {
    const actions: ActionButton[] = [];
    if (this.hasPermission(SchoolPermission.EDIT_SUBJECT)) {
      actions.push({ type: 'edit', tooltip: 'Edit Subject' });
    }
    if (this.hasPermission(SchoolPermission.DELETE_SUBJECT)) {
      actions.push({ type: 'delete', tooltip: 'Delete Subject' });
    }
    return actions;
  }

  onSubjectAction(action: ActionType, subj: any) {
    switch (action) {
      case 'edit': this.openModal(subj); break;
      case 'delete': this.confirmDelete(subj); break;
    }
  }
}
