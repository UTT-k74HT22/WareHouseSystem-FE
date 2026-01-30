import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthResponse } from "../../dto/response/Auth/AuthResponse";
import { AuthServiceService } from "../../service/AuthService/auth-service.service";
import { ToastrService } from "../../service/SystemService/toastr.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private authService: AuthServiceService,
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // getters cho template
  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePassword() {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastr.warning('Vui lòng điền đầy đủ thông tin đăng nhập', 'Thiếu thông tin');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { username, password } = this.loginForm.value;

    this.authService.login({ username, password }).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading = false;
        // Store tokens in localStorage
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);

        this.toastr.success('Chào mừng bạn quay trở lại!', 'Đăng nhập thành công');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng';
        this.isLoading = false;
        this.toastr.error(
          error.error?.message || 'Tên đăng nhập hoặc mật khẩu không đúng',
          'Đăng nhập thất bại'
        );
      }
    });
  }
}
