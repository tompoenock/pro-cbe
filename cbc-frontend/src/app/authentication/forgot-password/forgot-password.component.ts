import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  imports: [CommonModule, FormsModule, RouterLink],
})
export class ForgotPasswordComponent {
  email = '';
  successMessage: string | null = null;
  errorMessage: string | null = null;
  submitting = false;

  constructor(private authService: AuthService) {}

  onSubmit(form: NgForm) {
    if (form.invalid) return;

    this.successMessage = null;
    this.errorMessage = null;
    this.submitting = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.submitting = false;
        this.successMessage = res.message;
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'An error occurred.';
      },
    });
  }
}
