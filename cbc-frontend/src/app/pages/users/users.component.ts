import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActionButtonsComponent, ActionButton, ActionType } from '../../shared/components/action-buttons/action-buttons.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ViewModalComponent } from '../../shared/components/view-modal.component';
import { PermissionsModalComponent } from '../../shared/components/permissions-modal.component';
import { ThemeService } from '../../shared/services/theme.service';
import { UserService } from '../../shared/services/user.service';
import { PermissionService, SchoolPermission } from '../../shared/services/permission.service';
import { AuthService } from '../../authentication/core/auth/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ActionButtonsComponent, ConfirmDialogComponent, ViewModalComponent, PermissionsModalComponent],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  public darkMode = false;
  public users: any[] = [];
  public loading = false;
  public showModal = false;
  public showConfirm = false;
  public viewDetails = false;
  public viewFields: { label: string; value: string }[] = [];
  public confirmTitle = '';
  public confirmMessage = '';
  public confirmType: 'danger' | 'warning' | 'info' | 'success' = 'danger';
  public confirmAction: (() => void) | null = null;
  public error = '';
  public success = '';

  public searchTerm = '';
  public filterRole = '';
  public filterStatus = '';

  public editingUser: any = null;
  public form: any = {
    username: '',
    email: '',
    phone_no: '',
    role: 'user',
    password: '',
    isApproved: true,
  };
  public showPermissionsModal = false;
  public permissionUser: any = null;
  public showResetPasswordModal = false;
  public resetPasswordUser: any = null;
  public resetPasswordForm = { newPassword: '', confirmPassword: '' };
  public resetPasswordError = '';
  private currentUserId = '';
  public Permission = SchoolPermission;

  readonly roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'class_teacher', label: 'Class Teacher' },
    { value: 'parent', label: 'Parent' },
    { value: 'user', label: 'User' },
  ];

  constructor(
    private userService: UserService,
    private themeService: ThemeService,
    private permissionService: PermissionService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.themeService.darkMode$.subscribe((d: boolean) => (this.darkMode = d));
    this.currentUserId = this.authService.getUser()?._id || '';
    this.permissionService.loadCurrentUserPermissions();
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (data: any[]) => {
        this.users = data || [];
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to load users';
        this.loading = false;
      },
    });
  }

  get filteredUsers(): any[] {
    const term = this.searchTerm.toLowerCase().trim();

    return this.users
      .filter((user) => !!user)
      .filter((user) => {
        const matchesSearch = !term || [user.username, user.email, user.phone_no, user.role]
          .some((value) => (value || '').toString().toLowerCase().includes(term));
        const matchesRole = !this.filterRole || user.role === this.filterRole;
        const matchesStatus = !this.filterStatus || this.getUserStatus(user) === this.filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
      });
  }

  get totalUsersCount(): number {
    return this.filteredUsers.length;
  }

  get approvedUsersCount(): number {
    return this.filteredUsers.filter((user) => this.isApproved(user)).length;
  }

  get pendingUsersCount(): number {
    return this.filteredUsers.filter((user) => this.getUserStatus(user) === 'pending').length;
  }

  get adminUsersCount(): number {
    return this.filteredUsers.filter((user) => ['admin', 'super_admin'].includes(user.role)).length;
  }

  getUserStatus(user: any): 'approved' | 'pending' | 'rejected' {
    if (!user) return 'pending';
    if (user.isRejected) return 'rejected';
    if (this.isApproved(user)) return 'approved';
    return 'pending';
  }

  isApproved(user: any): boolean {
    return user?.isApproved !== false && !user?.isRejected;
  }

  getStatusBadgeClasses(user: any): string {
    const status = this.getUserStatus(user);
    const base = 'inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold';
    switch (status) {
      case 'approved':
        return `${base} bg-emerald-100 text-emerald-700`;
      case 'rejected':
        return `${base} bg-red-100 text-red-700`;
      default:
        return `${base} bg-yellow-100 text-yellow-800`;
    }
  }

  trackByUserId(index: number, user: any) {
    return user?._id || index;
  }

  openCreateModal() {
    this.error = '';
    this.success = '';
    this.editingUser = null;
    this.form = {
      username: '',
      email: '',
      phone_no: '',
      role: 'user',
      password: '',
      isApproved: true,
    };
    this.showModal = true;
  }

  openEdit(user: any) {
    this.error = '';
    this.success = '';
    this.editingUser = user;
    this.form = {
      username: user.username || '',
      email: user.email || '',
      phone_no: user.phone_no || '',
      role: user.role || 'user',
      password: '',
      isApproved: user.isApproved !== false,
    };
    this.showModal = true;
  }

  openView(user: any) {
    this.viewFields = [
      { label: 'Username', value: user.username },
      { label: 'Email', value: user.email },
      { label: 'Phone', value: user.phone_no || '-' },
      { label: 'Role', value: user.role },
      { label: 'Status', value: this.getUserStatus(user) },
      { label: 'Created At', value: new Date(user.createdAt).toLocaleString() },
      { label: 'Updated At', value: new Date(user.updatedAt).toLocaleString() },
    ];
    this.viewDetails = true;
  }

  confirmDelete(user: any) {
    this.confirmTitle = 'Delete User';
    this.confirmMessage = `Delete ${user.username || user.email}? This cannot be undone.`;
    this.confirmType = 'danger';
    this.confirmAction = () => {
      this.userService.delete(user._id).subscribe({
        next: () => {
          this.success = 'User deleted successfully.';
          this.loadUsers();
          this.showConfirm = false;
          setTimeout(() => (this.success = ''), 3000);
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to delete user';
          this.showConfirm = false;
        },
      });
    };
    this.showConfirm = true;
  }

  confirmApprove(user: any) {
    this.confirmTitle = 'Approve User';
    this.confirmMessage = `Approve ${user.username || user.email}?`;
    this.confirmType = 'success';
    this.confirmAction = () => {
      this.userService.approve(user._id).subscribe({
        next: () => {
          this.success = 'User approved successfully.';
          this.loadUsers();
          this.showConfirm = false;
          setTimeout(() => (this.success = ''), 3000);
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to approve user';
          this.showConfirm = false;
        },
      });
    };
    this.showConfirm = true;
  }

  confirmReject(user: any) {
    this.confirmTitle = 'Reject User';
    this.confirmMessage = `Reject ${user.username || user.email}?`;
    this.confirmType = 'warning';
    this.confirmAction = () => {
      this.userService.reject(user._id).subscribe({
        next: () => {
          this.success = 'User rejected successfully.';
          this.loadUsers();
          this.showConfirm = false;
          setTimeout(() => (this.success = ''), 3000);
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to reject user';
          this.showConfirm = false;
        },
      });
    };
    this.showConfirm = true;
  }

  getUserActions(user: any): ActionButton[] {
    const actions: ActionButton[] = [
      { type: 'view', tooltip: 'View Details' },
    ];

    if (this.hasPermission(SchoolPermission.EDIT_USER)) {
      actions.push({ type: 'edit', tooltip: 'Edit User' });
    }

    if (this.hasPermission(SchoolPermission.DELETE_USER)) {
      actions.push({ type: 'delete', tooltip: 'Delete User' });
    }

    if (!this.isApproved(user) && this.hasPermission(SchoolPermission.APPROVE_USER)) {
      actions.unshift({ type: 'approve', tooltip: 'Approve User' });
      actions.push({ type: 'reject', tooltip: 'Reject User' });
    }

    if (this.hasPermission(SchoolPermission.MANAGE_USER_PERMISSIONS)) {
      actions.push({ type: 'permissions', tooltip: 'Manage Permissions' });
    }

    if (this.hasPermission(SchoolPermission.RESET_USER_PASSWORD)) {
      actions.push({ type: 'resetPassword', tooltip: 'Reset Password' });
    }

    return actions;
  }

  onUserAction(action: ActionType, user: any) {
    switch (action) {
      case 'view':
        this.openView(user);
        break;
      case 'edit':
        this.openEdit(user);
        break;
      case 'delete':
        this.confirmDelete(user);
        break;
      case 'approve':
        this.confirmApprove(user);
        break;
      case 'reject':
        this.confirmReject(user);
        break;
      case 'permissions':
        this.openPermissions(user);
        break;
      case 'resetPassword':
        this.openResetPassword(user);
        break;
    }
  }

  saveUser() {
    this.error = '';

    const isCreating = !this.editingUser;
    if (isCreating && !this.hasPermission(SchoolPermission.CREATE_USER)) {
      this.error = 'You do not have permission to create users.';
      return;
    }

    if (!isCreating && !this.hasPermission(SchoolPermission.EDIT_USER)) {
      this.error = 'You do not have permission to edit users.';
      return;
    }

    const payload: any = {
      username: this.form.username,
      email: this.form.email,
      phone_no: this.form.phone_no,
      role: this.form.role,
      isApproved: this.form.isApproved,
    };

    if (!this.editingUser) {
      if (!this.form.password) {
        this.error = 'Password is required for new users.';
        return;
      }
      payload.password = this.form.password;
    }

    const request = this.editingUser
      ? this.userService.update(this.editingUser._id, payload)
      : this.userService.create(payload);

    request.subscribe({
      next: () => {
        this.success = this.editingUser ? 'User updated successfully.' : 'User created successfully.';
        this.showModal = false;
        this.loadUsers();
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to save user';
      },
    });
  }

  openPermissions(user: any) {
    this.permissionUser = user;
    this.showPermissionsModal = true;
  }

  handlePermissionsSaved() {
    this.success = 'Permissions saved successfully.';
    if (this.permissionUser?._id === this.currentUserId) {
      this.permissionService.loadCurrentUserPermissions();
    }
    this.showPermissionsModal = false;
    this.permissionUser = null;
    setTimeout(() => (this.success = ''), 3000);
  }

  hasPermission(permission: SchoolPermission): boolean {
    return this.permissionService.hasPermission(permission);
  }

  openResetPassword(user: any) {
    this.resetPasswordError = '';
    this.resetPasswordUser = user;
    this.resetPasswordForm = { newPassword: '', confirmPassword: '' };
    this.showResetPasswordModal = true;
  }

  submitResetPassword() {
    this.resetPasswordError = '';
    const { newPassword, confirmPassword } = this.resetPasswordForm;

    if (!newPassword || !confirmPassword) {
      this.resetPasswordError = 'All fields are required.';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.resetPasswordError = 'Passwords do not match.';
      return;
    }

    if (newPassword.length < 8) {
      this.resetPasswordError = 'Password must be at least 8 characters.';
      return;
    }

    this.userService.resetPassword(this.resetPasswordUser._id, {
      newPassword,
      confirmPassword,
    }).subscribe({
      next: () => {
        this.success = `Password reset for ${this.resetPasswordUser.username || this.resetPasswordUser.email}.`;
        this.showResetPasswordModal = false;
        this.resetPasswordUser = null;
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (err: any) => {
        this.resetPasswordError = err.error?.message || 'Failed to reset password';
      },
    });
  }

  closeView() {
    this.viewDetails = false;
  }
}
