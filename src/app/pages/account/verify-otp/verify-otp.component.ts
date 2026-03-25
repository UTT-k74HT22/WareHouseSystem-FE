import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/service/AuthService/auth-service.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css']
})
export class VerifyOtpComponent implements OnInit {
  verifyOtpForm!: FormGroup;
  submitted = false;
  isLoading = false;
  isResending = false;
  errorMessage?: string;
  successMessage?: string;
  email?: string;
  countdown = 0;
  countdownInterval: any;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.verifyOtpForm = this.formBuilder.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.route.queryParams.subscribe(params => {
      this.email = typeof params['email'] === 'string' ? params['email'].trim().toLowerCase() : undefined;
    });
  }

  get otp() {
    return this.verifyOtpForm.get('otp');
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = undefined;
    this.successMessage = undefined;

    if (this.verifyOtpForm.invalid) {
      return;
    }

    if (!this.email) {
      this.errorMessage = 'Email not found.';
      return;
    }

    this.isLoading = true;
    const otp = String(this.otp?.value ?? '').trim();
    this.authService.verifyForgotPasswordOtp({ email: this.email.trim().toLowerCase(), otp }).subscribe(
      (response) => {
        this.isLoading = false;
        const resetToken = response.data?.resetToken;
        if (!resetToken) {
          this.errorMessage = 'OTP đã được xác minh nhưng không nhận được token đặt lại.';
          return;
        }
        this.router.navigate(['/reset-password', resetToken]);
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      }
    );
  }

  resendOtp(): void {
    if (this.countdown > 0 || !this.email) {
      return;
    }

    this.isResending = true;
    this.errorMessage = undefined;
    this.successMessage = undefined;

    this.authService.forgotPassword({ email: this.email }).subscribe(
      () => {
        this.isResending = false;
        this.successMessage = 'Đã gửi lại mã OTP.';
        this.startCountdown();
      },
      (error) => {
        this.isResending = false;
        this.errorMessage = error?.error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      }
    );
  }

  private startCountdown(): void {
    this.countdown = 60;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }
}
