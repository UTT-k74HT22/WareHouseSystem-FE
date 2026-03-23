import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/service/AuthService/auth-service.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  submitted = false;
  isLoading = false;
  errorMessage?: string;
  successMessage?: string;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = undefined;
    this.successMessage = undefined;

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isLoading = true;
    const email = (this.email?.value ?? '').trim().toLowerCase();
    this.authService.forgotPassword({ email }).subscribe(
      () => {
        this.isLoading = false;
        this.successMessage = 'An email has been sent with a link to reset your password.';
        this.router.navigate(['/verify-otp'], { queryParams: { email } });
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.error.message || 'An error occurred. Please try again.';
      }
    );
  }
}
