import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { Role } from '../../shared/models/roles.enum';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule, RouterLink],
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage: string | null = null;
  showPassword = false;
  loading = false;
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
    if (form.invalid) {
      this.errorMessage = 'Please fill all fields correctly.';
      return;
    }

    this.errorMessage = null;
    this.loading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        this.loading = false;

        const role = Object.values(Role).includes(res.user.role) ? res.user.role : Role.User;
        localStorage.setItem('userId', res.user._id);
        localStorage.setItem('role', role);

        if (res.requirePasswordChange) {
          localStorage.setItem('requirePasswordChange', 'true');
          this.router.navigate(['/update-password']);
          return;
        }

        // Always redirect to dashboard after login; users can navigate to parent portal from there
        this.router.navigate(['/app/dashboard']);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      },
    });
  }
}
