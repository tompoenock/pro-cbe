import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../shared/services/staff.service';
import { ThemeService } from '../../shared/services/theme.service';
import { PermissionService, SchoolPermission } from '../../shared/services/permission.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ViewModalComponent } from '../../shared/components/view-modal.component';
import { ActionButtonsComponent, ActionButton, ActionType } from '../../shared/components/action-buttons/action-buttons.component';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ViewModalComponent, ActionButtonsComponent],
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.css'],
})
export class StaffComponent implements OnInit {
  darkMode = false;
  staffList: any[] = [];
  loading = false;
  showModal = false;
  editingId: string | null = null;
  error = '';
  success = '';
  searchTerm = '';
  filterType = '';

  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmType: 'danger' | 'warning' | 'info' | 'success' = 'danger';
  confirmAction: (() => void) | null = null;

  showView = false;
  viewFields: { label: string; value: string }[] = [];

  staffTypes = ['teaching', 'non-teaching', 'admin'];
  genders = ['male', 'female', 'other'];

  form: any = {
    firstName: '', lastName: '', staffNumber: '', email: '', phone: '',
    staffType: 'teaching', department: '', designation: '', qualification: '',
    dateOfJoining: '', gender: '',
  };

  constructor(
    private staffService: StaffService,
    private themeService: ThemeService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this.themeService.darkMode$.subscribe((d: boolean) => (this.darkMode = d));
    this.loadStaff();
  }

  loadStaff() {
    this.loading = true;
    this.staffService.getAll(this.filterType || undefined, this.searchTerm || undefined).subscribe({
      next: (data: any) => { this.staffList = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openModal(item?: any) {
    this.error = '';
    if (item) {
      if (!this.hasPermission(SchoolPermission.EDIT_STAFF)) {
        this.error = 'You do not have permission to edit staff records.';
        return;
      }
      this.editingId = item._id;
      this.form = {
        firstName: item.firstName, lastName: item.lastName, staffNumber: item.staffNumber,
        email: item.email || '', phone: item.phone || '', staffType: item.staffType,
        department: item.department || '', designation: item.designation || '',
        qualification: item.qualification || '', dateOfJoining: item.dateOfJoining?.split('T')[0] || '',
        gender: item.gender || '',
      };
    } else {
      if (!this.hasPermission(SchoolPermission.CREATE_STAFF)) {
        this.error = 'You do not have permission to create staff records.';
        return;
      }
      this.form = { firstName: '', lastName: '', staffNumber: '', email: '', phone: '',
        staffType: 'teaching', department: '', designation: '', qualification: '', dateOfJoining: '', gender: '' };
    }
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.editingId = null; }

  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  save() {
    if (this.editingId && !this.hasPermission(SchoolPermission.EDIT_STAFF)) {
      this.error = 'You do not have permission to edit staff records.';
      return;
    }
    if (!this.editingId && !this.hasPermission(SchoolPermission.CREATE_STAFF)) {
      this.error = 'You do not have permission to create staff records.';
      return;
    }

    const data: any = { ...this.form };
    Object.keys(data).forEach(k => { if (!data[k]) delete data[k]; });

    const obs = this.editingId
      ? this.staffService.update(this.editingId, data)
      : this.staffService.create(data);

    obs.subscribe({
      next: () => {
        this.success = this.editingId ? 'Staff updated!' : 'Staff created!';
        this.closeModal(); this.loadStaff(); setTimeout(() => (this.success = ''), 3000);
      },
      error: (err: any) => { this.error = err.error?.message || 'Failed to save'; },
    });
  }

  viewStaff(staff: any) {
    this.viewFields = [
      { label: 'Name', value: `${staff.firstName} ${staff.lastName}` },
      { label: 'Staff Number', value: staff.staffNumber },
      { label: 'Email', value: staff.email || '-' },
      { label: 'Phone', value: staff.phone || '-' },
      { label: 'Type', value: staff.staffType },
      { label: 'Department', value: staff.department || '-' },
      { label: 'Designation', value: staff.designation || '-' },
      { label: 'Qualification', value: staff.qualification || '-' },
      { label: 'Gender', value: staff.gender || '-' },
      { label: 'Date of Joining', value: staff.dateOfJoining ? new Date(staff.dateOfJoining).toLocaleDateString() : '-' },
    ];
    this.showView = true;
  }

  confirmDelete(staff: any) {
    if (!this.hasPermission(SchoolPermission.DELETE_STAFF)) {
      this.error = 'You do not have permission to delete staff records.';
      return;
    }
    this.confirmTitle = 'Delete Staff';
    this.confirmMessage = `Delete "${staff.firstName} ${staff.lastName}"? This cannot be undone.`;
    this.confirmType = 'danger';
    this.confirmAction = () => {
      this.staffService.delete(staff._id).subscribe({
        next: () => { this.success = 'Staff deleted!'; this.loadStaff(); this.showConfirm = false; setTimeout(() => (this.success = ''), 3000); },
        error: (err: any) => { this.error = err.error?.message || 'Failed to delete'; this.showConfirm = false; },
      });
    };
    this.showConfirm = true;
  }

  getStaffActions(): ActionButton[] {
    const actions: ActionButton[] = [
      { type: 'view', tooltip: 'View Details' },
    ];
    if (this.hasPermission(SchoolPermission.EDIT_STAFF)) {
      actions.push({ type: 'edit', tooltip: 'Edit Staff' });
    }
    if (this.hasPermission(SchoolPermission.DELETE_STAFF)) {
      actions.push({ type: 'delete', tooltip: 'Delete Staff' });
    }
    return actions;
  }

  onStaffAction(action: ActionType, staff: any) {
    switch (action) {
      case 'view': this.viewStaff(staff); break;
      case 'edit': this.openModal(staff); break;
      case 'delete': this.confirmDelete(staff); break;
    }
  }
}
