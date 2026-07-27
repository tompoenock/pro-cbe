import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { Role } from '../../shared/models/roles.enum';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [CommonModule, FormsModule, RouterLink],
})
export class RegisterComponent {
  Role = Role;
  username = '';
  phone_no = '';
  email = '';
  password = '';
  confirmPassword = '';
  role: Role = Role.User;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  registrationComplete = false;
  showPassword = false;
  showConfirmPassword = false;
  submitting = false;
  darkMode = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
  ) {
    this.themeService.darkMode$.subscribe(d => this.darkMode = d);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  onSubmit(form: NgForm) {
    if (form.invalid || this.password !== this.confirmPassword) {
      this.errorMessage = 'Please fill all fields correctly and ensure passwords match.';
      return;
    }

    this.errorMessage = null;
    this.submitting = true;

    this.authService
      .register({
        username: this.username,
        phone_no: this.phone_no,
        email: this.email,
        password: this.password,
        role: this.role,
      })
      .subscribe({
        next: (res: any) => {
          this.submitting = false;
          this.registrationComplete = true;
          this.successMessage =
            res?.message || 'Registration successful! Your account is pending admin approval.';
        },
        error: (err: { error: { message: string } }) => {
          this.submitting = false;
          this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        },
      });
  }
}
