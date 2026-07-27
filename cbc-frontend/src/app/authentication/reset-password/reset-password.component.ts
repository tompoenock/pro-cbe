import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  imports: [CommonModule, FormsModule, RouterLink],
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  successMessage: string | null = null;
  errorMessage: string | null = null;
  submitting = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit(form: NgForm) {
    if (form.invalid || this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Please fill all fields and ensure passwords match.';
      return;
    }

    this.errorMessage = null;
    this.submitting = true;

    this.authService.resetPassword({ token: this.token, newPassword: this.newPassword }).subscribe({
      next: (res: any) => {
        this.submitting = false;
        this.successMessage = res.message;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err: any) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to reset password';
      },
    });
  }
}
