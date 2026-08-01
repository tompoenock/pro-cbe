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
  logoUrl = 'https://res.cloudinary.com/dkero7wyo/image/upload/v1785607042/2c16552c-a4a6-42d7-8144-0503a8697568_leewml.jpg';

  schoolDecorLeft: any[] = [
    { id: 'cap', cls: 'top-16 right-10 w-36 h-36 -rotate-12', d: 'M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5' },
    { id: 'pencil', cls: 'top-44 right-44 w-24 h-24 rotate-45', d: 'm16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125' },
    { id: 'book', cls: 'top-1/2 right-8 w-32 h-32', d: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25' },
    { id: 'bell', cls: 'bottom-36 right-28 w-20 h-20', d: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0' },
    { id: 'school', cls: 'bottom-14 left-1/2 w-28 h-28', d: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z' },
    { id: 'bulb', cls: 'top-1/2 left-4 w-16 h-16', d: 'M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18' },
  ];

  schoolDecorRight: any[] = [
    { id: 'cap', cls: 'top-24 right-8 w-28 h-28 -rotate-12', d: 'M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5' },
    { id: 'pencil', cls: 'top-1/3 left-8 w-20 h-20 rotate-12', d: 'm16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125' },
    { id: 'book', cls: 'bottom-16 left-8 w-32 h-32', d: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25' },
    { id: 'apple', cls: 'bottom-44 right-12 w-24 h-24', d: 'M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42' },
    { id: 'doc', cls: 'top-1/2 right-1/4 w-28 h-28 -rotate-6', d: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z' },
  ];

  trackByDecor(index: number, item: any) {
    return item?.id ?? index;
  }

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
  step = 1;
  showStep1Errors = false;

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

  nextStep() {
    this.showStep1Errors = true;
    if (!this.username || !this.phone_no) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }
    this.errorMessage = null;
    this.step = 2;
  }

  prevStep() {
    this.step = 1;
    this.errorMessage = null;
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
