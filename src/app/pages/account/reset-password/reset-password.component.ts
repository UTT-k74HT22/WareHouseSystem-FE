import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/service/AuthService/auth-service.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  submitted = false;
  isLoading = false;
  errorMessage?: string;
  successMessage?: string;
  token?: string;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.resetPasswordForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });

    this.token = this.route.snapshot.paramMap.get('token') ?? undefined;
  }

  get password() {
    return this.resetPasswordForm.get('password');
  }

  get confirmPassword() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPassword(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = undefined;
    this.successMessage = undefined;

    if (this.resetPasswordForm.invalid) {
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Token not found.';
      return;
    }

    this.isLoading = true;
    const newPassword = this.password?.value;
    this.authService.resetPassword(this.token, { new_password: newPassword }).subscribe(
      () => {
        this.isLoading = false;
        this.successMessage = 'Your password has been reset successfully.';
        this.resetPasswordForm.reset();
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.error.message || 'An error occurred. Please try again.';
      }
    );
  }
}
