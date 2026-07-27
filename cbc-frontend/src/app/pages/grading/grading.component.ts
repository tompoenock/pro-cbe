import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GradingService } from '../../shared/services/grading.service';
import { ThemeService } from '../../shared/services/theme.service';
import { PermissionService, SchoolPermission } from '../../shared/services/permission.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ActionButtonsComponent, ActionButton, ActionType } from '../../shared/components/action-buttons/action-buttons.component';
import { DEFAULT_GRADES } from '../../shared/constants/grading.constants';

@Component({
  selector: 'app-grading',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ActionButtonsComponent],
  templateUrl: './grading.component.html',
  styleUrls: ['./grading.component.css'],
})
export class GradingComponent implements OnInit {
  darkMode = false;
  scales: any[] = [];
  defaultTemplate: any = null;
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

  form = {
    name: '',
    isDefault: false,
    grades: DEFAULT_GRADES.map(g => ({ ...g })),
  };

  constructor(
    private gradingService: GradingService,
    private themeService: ThemeService,
    private permissionService: PermissionService,
  ) {}

  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  ngOnInit() {
    this.themeService.darkMode$.subscribe((d: boolean) => (this.darkMode = d));
    this.loadScales();
  }

  loadScales() {
    this.loading = true;
    this.gradingService.getAll().subscribe({
      next: (data: any) => { 
        this.scales = data;
        // Extract and highlight the default template
        this.defaultTemplate = data.find((scale: any) => scale.isDefault);
        this.loading = false; 
      },
      error: () => { this.loading = false; },
    });
  }

  openModal(item?: any) {
    this.error = '';
    if (item) {
      if (!this.hasPermission(SchoolPermission.EDIT_GRADE)) {
        this.error = 'You do not have permission to edit grading scales.';
        return;
      }
      this.editingId = item._id;
      this.form = {
        name: item.name,
        isDefault: item.isDefault,
        grades: item.grades.map((g: any) => ({ ...g })),
      };
    } else {
      if (!this.hasPermission(SchoolPermission.CREATE_GRADE)) {
        this.error = 'You do not have permission to create grading scales.';
        return;
      }
      this.editingId = null;
      this.form = {
        name: '',
        isDefault: false,
        grades: DEFAULT_GRADES.map(g => ({ ...g })),
      };
    }
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.editingId = null; }

  addGrade() {
    if (!this.hasPermission(SchoolPermission.CREATE_GRADE)) {
      this.error = 'You do not have permission to add grading rows.';
      return;
    }
    this.form.grades.push({ grade: '', minScore: 0, maxScore: 0, remark: '', points: 0 });
  }

  removeGrade(index: number) {
    if (!this.hasPermission(SchoolPermission.EDIT_GRADE)) {
      this.error = 'You do not have permission to modify grading rows.';
      return;
    }
    this.form.grades.splice(index, 1);
  }

  save() {
    if (this.editingId && !this.hasPermission(SchoolPermission.EDIT_GRADE)) {
      this.error = 'You do not have permission to edit grading scales.';
      return;
    }
    if (!this.editingId && !this.hasPermission(SchoolPermission.CREATE_GRADE)) {
      this.error = 'You do not have permission to create grading scales.';
      return;
    }

    const obs = this.editingId
      ? this.gradingService.update(this.editingId, this.form)
      : this.gradingService.create(this.form);

    obs.subscribe({
      next: () => {
        this.success = this.editingId ? 'Grading scale updated!' : 'Grading scale created!';
        this.closeModal();
        this.loadScales();
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (err: any) => { this.error = err.error?.message || 'Failed to save'; },
    });
  }

  deleteScale(id: string) {
    if (!this.hasPermission(SchoolPermission.DELETE_GRADE)) {
      this.error = 'You do not have permission to delete grading scales.';
      return;
    }
    this.gradingService.delete(id).subscribe({
      next: () => { this.success = 'Scale deleted!'; this.loadScales(); this.showConfirm = false; setTimeout(() => (this.success = ''), 3000); },
      error: (err: any) => { this.error = err.error?.message || 'Failed to delete'; this.showConfirm = false; },
    });
  }

  confirmDelete(scale: any) {
    this.confirmTitle = 'Delete Grading Scale';
    this.confirmMessage = `Delete "${scale.name}"? This cannot be undone.`;
    this.confirmType = 'danger';
    this.confirmAction = () => this.deleteScale(scale._id);
    this.showConfirm = true;
  }

  getScaleActions(): ActionButton[] {
    const actions: ActionButton[] = [];
    if (this.hasPermission(SchoolPermission.EDIT_GRADE)) {
      actions.push({ type: 'edit', tooltip: 'Edit Scale' });
    }
    if (this.hasPermission(SchoolPermission.DELETE_GRADE)) {
      actions.push({ type: 'delete', tooltip: 'Delete Scale' });
    }
    return actions;
  }

  onScaleAction(action: ActionType, scale: any) {
    switch (action) {
      case 'edit': this.openModal(scale); break;
      case 'delete': this.confirmDelete(scale); break;
    }
  }
}
