import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { ToastrService } from "../../service/SystemService/toastr.service";
import { AuthService } from "../../service/AuthService/auth-service.service";

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
  returnUrl: string = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }

    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

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
      this.toastr.warning('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin đăng nhập');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { username, password } = this.loginForm.value;

    this.authService.login({ username, password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastr.success('Đăng nhập thành công', 'Chào mừng bạn quay trở lại!');
        // Đảm bảo authState được cập nhật trước khi navigate
        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 0);
      },
      error: (error: any) => {
        console.error(error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Tên đăng nhập hoặc mật khẩu không đúng';
        this.toastr.error('Đăng nhập thất bại', this.errorMessage);
      }
    });
  }
}
