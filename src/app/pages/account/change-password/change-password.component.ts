import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ToastrService } from '../../../service/SystemService/toastr.service';
import { AuthService } from 'src/app/service/AuthService/auth-service.service';
import { ChangePasswordRequest } from 'src/app/dto/request/Auth/ChangePasswordRequest';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  passwordForm!: FormGroup;
  isLoading = false;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private authService: AuthService
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordStrength]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatch });
  }

  passwordStrength(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;
    return valid ? null : { passwordStrength: true };
  }

  passwordMatch(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  getPasswordStrengthLevel(): number {
    const value = this.passwordForm.get('newPassword')?.value || '';
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) score++;
    return score;
  }

  getPasswordStrengthText(): string {
    const level = this.getPasswordStrengthLevel();
    if (level <= 1) return 'Yếu';
    if (level <= 2) return 'Trung bình';
    if (level <= 3) return 'Khá';
    if (level <= 4) return 'Mạnh';
    return 'Rất mạnh';
  }

  getPasswordStrengthColor(): string {
    const level = this.getPasswordStrengthLevel();
    if (level <= 1) return '#ef4444';
    if (level <= 2) return '#f97316';
    if (level <= 3) return '#facc15';
    if (level <= 4) return '#22c55e';
    return '#16a34a';
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current': this.showCurrentPassword = !this.showCurrentPassword; break;
      case 'new': this.showNewPassword = !this.showNewPassword; break;
      case 'confirm': this.showConfirmPassword = !this.showConfirmPassword; break;
    }
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.toastr.warning('Thiếu hoặc sai thông tin', 'Kiểm tra lại mật khẩu hiện tại, mật khẩu mới và phần xác nhận.');
      return;
    }

    this.isLoading = true;

    const request: ChangePasswordRequest = {
      old_password: this.passwordForm.value.currentPassword,
      new_password: this.passwordForm.value.newPassword
    };

    this.authService.changePassword(request).subscribe(
      () => {
        this.isLoading = false;
        this.passwordForm.reset();
        this.toastr.success('Thành công', 'Đổi mật khẩu thành công');
      },
      (error) => {
        this.isLoading = false;
        this.toastr.error('Lỗi', error.error.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    );
  }

  get f() {
    return this.passwordForm.controls;
  }
}
