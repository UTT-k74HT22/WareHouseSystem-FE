import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from '../../service/SystemService/toastr.service';
import {AuthService} from '../../service/AuthService/auth-service.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  get username() {
    return this.registerForm.get('username');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastr.warning('Vui lòng điền đầy đủ thông tin hợp lệ', 'Thiếu thông tin');
      return;
    }

    const { password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.toastr.error('Mật khẩu xác nhận không khớp', 'Lỗi xác nhận');
      return;
    }

    this.isLoading = true;

    // Example: Call register service
    // this.authService.register(this.registerForm.value).subscribe({
    //   next: (response) => {
    //     this.isLoading = false;
    //     this.toastr.success('Tài khoản đã được tạo thành công!', 'Đăng ký thành công');
    //     this.router.navigate(['/login']);
    //   },
    //   error: (error) => {
    //     this.isLoading = false;
    //     this.toastr.error(error.error?.message || 'Đăng ký thất bại', 'Lỗi');
    //   }
    // });

    // Demo toastr
    setTimeout(() => {
      this.isLoading = false;
      this.toastr.success('Tài khoản đã được tạo thành công!', 'Đăng ký thành công');
    }, 1500);
  }
}
