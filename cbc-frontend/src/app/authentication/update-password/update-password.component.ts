import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-update-password',
  standalone: true,
  templateUrl: './update-password.component.html',
  styleUrls: ['./update-password.component.css'],
  imports: [CommonModule, FormsModule, RouterLink],
})
export class UpdatePasswordComponent implements OnInit {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  successMessage: string | null = null;
  errorMessage: string | null = null;
  submitting = false;
  isFirstTime = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isFirstTime = localStorage.getItem('requirePasswordChange') === 'true';
  }

  onSubmit(form: NgForm) {
    if (form.invalid || this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Please fill all fields and ensure passwords match.';
      return;
    }

    this.errorMessage = null;
    this.submitting = true;

    if (this.isFirstTime) {
      this.authService.firstTimePasswordChange({ newPassword: this.newPassword }).subscribe({
        next: () => {
          this.submitting = false;
          localStorage.removeItem('requirePasswordChange');
          this.router.navigate(['/app/dashboard']);
        },
        error: (err: any) => {
          this.submitting = false;
          this.errorMessage = err.error?.message || 'Failed to change password.';
        },
      });
    } else {
      this.authService
        .updatePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword })
        .subscribe({
          next: () => {
            this.submitting = false;
            this.successMessage = 'Password updated successfully.';
            this.currentPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';
          },
          error: (err: any) => {
            this.submitting = false;
            this.errorMessage = err.error?.message || 'Failed to update password.';
          },
        });
    }
  }
}
