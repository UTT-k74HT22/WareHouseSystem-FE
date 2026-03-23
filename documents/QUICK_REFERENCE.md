# Quick Reference & Setup Guide

## 📋 Tổng quan

Document này cung cấp quick reference cho các tác vụ thường gặp và hướng dẫn setup project.

---

## 🚀 Project Setup

### Prerequisites

- Node.js: v16.x hoặc cao hơn
- npm: v8.x hoặc cao hơn
- Angular CLI: v15.x
- IDE: Visual Studio Code, WebStorm, hoặc IntelliJ IDEA

### Initial Setup

```bash
# Clone repository
git clone [repository-url]
cd whsFE

# Install dependencies
npm install

# Start development server
npm start
# hoặc
ng serve

# Application sẽ chạy tại http://localhost:4200
```

### Build for Production

```bash
# Build production
npm run build
# hoặc
ng build --configuration production

# Output sẽ ở trong thư mục dist/
```

### Running Tests

```bash
# Run unit tests
npm test
# hoặc
ng test

# Run tests với coverage
ng test --code-coverage

# Run tests một lần (CI/CD)
ng test --watch=false --browsers=ChromeHeadless
```

---

## 📁 Project Structure Quick Reference

```
src/app/
├── authenticate/          # Login, Register components
├── dto/                   # Data Transfer Objects
│   ├── ApiResponse.ts     # Generic API response wrapper
│   ├── [Entity].ts        # Domain models
│   ├── request/           # Request DTOs
│   └── response/          # Response DTOs
├── helper/                # Utilities, Mappers
├── pages/                 # Main feature pages
│   ├── dashboard/         # Dashboard page
│   └── warehouse/         # Warehouse management
├── security/              # Authentication & Authorization
│   ├── guards/            # Route guards
│   └── interceptors/      # HTTP interceptors
├── service/               # Business logic services
│   ├── AuthService/       # Authentication service
│   ├── SystemService/     # System utilities (Toastr, etc.)
│   └── [Feature]Service/  # Feature-specific services
└── share/                 # Shared components
    ├── layout/            # Layout components
    └── toastr/            # Toast notifications
```

---

## ⚡ Common Commands

### Angular CLI Commands

```bash
# Generate new component
ng generate component pages/[name]
ng g c pages/[name]

# Generate new service
ng generate service service/[Name]Service/[name]
ng g s service/[Name]Service/[name]

# Generate new guard
ng generate guard security/guards/[name]
ng g g security/guards/[name]

# Generate new interceptor
ng generate interceptor security/interceptors/[name]
ng g interceptor security/interceptors/[name]

# Generate new pipe
ng generate pipe pipes/[name]
ng g p pipes/[name]

# Generate new directive
ng generate directive directives/[name]
ng g d directives/[name]

# Generate new interface
ng generate interface dto/[name]
ng g i dto/[name]
```

### Development Commands

```bash
# Start dev server
ng serve

# Start dev server với port khác
ng serve --port 4300

# Start với production configuration
ng serve --configuration production

# Start với auto-open browser
ng serve --open
ng serve -o

# Build project
ng build

# Build với production optimization
ng build --prod

# Lint code
ng lint

# Format code với Prettier (nếu có cài)
npm run format
```

---

## 🔧 Quick Code Snippets

### 1. Tạo Component với Service

```typescript
// Component
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class ExampleComponent implements OnInit, OnDestroy {
  data: any[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(private exampleService: ExampleService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.exampleService.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.data = response.data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
        }
      });
  }
}
```

### 2. Service với HTTP

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/ApiResponse';

@Injectable({
  providedIn: 'root'
})
export class ExampleService {
  private apiUrl = 'http://localhost:8080/api/v1/example';

  constructor(private http: HttpClient) {}

  getData(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getById(id: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  create(data: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, data).pipe(
      map(response => response.data)
    );
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, data).pipe(
      map(response => response.data)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }
}
```

### 3. Form với Validation

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/core';

@Component({
  selector: 'app-form-example',
  templateUrl: './form-example.component.html'
})
export class FormExampleComponent implements OnInit {
  form: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      description: ['']
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    const formData = this.form.value;
    // Process form data
    console.log('Form data:', formData);
  }

  onReset(): void {
    this.submitted = false;
    this.form.reset();
  }
}
```

```html
<!-- Template -->
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <div class="form-group">
    <label>Name</label>
    <input type="text" formControlName="name" class="form-control"
           [ngClass]="{'is-invalid': submitted && f['name'].errors}">
    <div *ngIf="submitted && f['name'].errors" class="invalid-feedback">
      <div *ngIf="f['name'].errors['required']">Name is required</div>
      <div *ngIf="f['name'].errors['minlength']">Minimum 3 characters</div>
    </div>
  </div>

  <div class="form-group">
    <label>Email</label>
    <input type="email" formControlName="email" class="form-control"
           [ngClass]="{'is-invalid': submitted && f['email'].errors}">
    <div *ngIf="submitted && f['email'].errors" class="invalid-feedback">
      <div *ngIf="f['email'].errors['required']">Email is required</div>
      <div *ngIf="f['email'].errors['email']">Invalid email</div>
    </div>
  </div>

  <button type="submit" class="btn btn-primary">Submit</button>
  <button type="button" class="btn btn-secondary" (click)="onReset()">Reset</button>
</form>
```

### 4. Guard Template

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../service/AuthService/auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredRoles = route.data['roles'] as Array<string>;

    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        if (!authState.isAuthenticated) {
          this.router.navigate(['/login']);
          return false;
        }

        const userRoles = authState.roles;
        const hasRole = requiredRoles.some(role => userRoles.includes(role));

        if (!hasRole) {
          this.router.navigate(['/dashboard']);
          return false;
        }

        return true;
      })
    );
  }
}
```

### 5. Custom Pipe

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusText'
})
export class StatusTextPipe implements PipeTransform {
  private statusMap: { [key: string]: string } = {
    'ACTIVE': 'Hoạt động',
    'INACTIVE': 'Không hoạt động',
    'MAINTENANCE': 'Bảo trì',
    'PENDING': 'Chờ xử lý'
  };

  transform(value: string): string {
    return this.statusMap[value] || value;
  }
}

// Usage trong template:
// {{ warehouse.status | statusText }}
```

### 6. Custom Directive

```typescript
import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appNumberOnly]'
})
export class NumberOnlyDirective {
  @Input() allowDecimal: boolean = false;

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete'];
    
    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (this.allowDecimal && event.key === '.' && !this.el.nativeElement.value.includes('.')) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }
}

// Usage: <input type="text" appNumberOnly [allowDecimal]="true">
```

---

## 🎨 CSS/Styling Quick Reference

### Common CSS Classes

```css
/* Layout */
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.flex { display: flex; }
.flex-center { display: flex; justify-content: center; align-items: center; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }

/* Spacing */
.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }
.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 1.5rem; }
.p-1 { padding: 0.5rem; }
.p-2 { padding: 1rem; }
.p-3 { padding: 1.5rem; }

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary { background-color: #007bff; color: white; }
.btn-secondary { background-color: #6c757d; color: white; }
.btn-success { background-color: #28a745; color: white; }
.btn-danger { background-color: #dc3545; color: white; }
.btn-warning { background-color: #ffc107; color: black; }

/* Status badges */
.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
.badge-success { background-color: #d4edda; color: #155724; }
.badge-warning { background-color: #fff3cd; color: #856404; }
.badge-danger { background-color: #f8d7da; color: #721c24; }
.badge-info { background-color: #d1ecf1; color: #0c5460; }

/* Table */
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}
.table th {
  background-color: #f8f9fa;
  font-weight: bold;
}

/* Loading */
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error

**Symptom**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**:
```typescript
// Backend cần enable CORS
// Hoặc dùng proxy trong Angular

// angular.json - thêm proxy config
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}

// proxy.conf.json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

### Issue 2: Token Expiration

**Symptom**: 401 Unauthorized sau một thời gian

**Solution**:
```typescript
// Implement token refresh
refreshToken(): Observable<AuthTokens> {
  const refreshToken = this.storage.getRefreshToken();
  return this.http.post<ApiResponse<AuthResponse>>(
    `${this.apiUrl}/refresh`,
    { refreshToken }
  ).pipe(
    map(response => this.mapper.mapToTokens(response.data)),
    tap(tokens => this.setSession(tokens))
  );
}

// Interceptor tự động refresh token khi 401
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return next.handle(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        return this.authService.refreshToken().pipe(
          switchMap(() => next.handle(req))
        );
      }
      return throwError(() => error);
    })
  );
}
```

### Issue 3: Memory Leaks

**Symptom**: Application becomes slow over time

**Solution**:
```typescript
// Always unsubscribe trong ngOnDestroy
private destroy$ = new Subject<void>();

ngOnInit(): void {
  this.service.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(...);
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Issue 4: Form Not Updating

**Symptom**: Form values không update

**Solution**:
```typescript
// Sử dụng patchValue hoặc setValue
this.form.patchValue({
  name: data.name,
  email: data.email
});

// Hoặc reset với values
this.form.reset({
  name: data.name,
  email: data.email
});
```

---

## 📊 Performance Tips

### 1. OnPush Change Detection

```typescript
@Component({
  selector: 'app-optimized',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class OptimizedComponent {
  // Component will only check for changes when:
  // 1. Input properties change
  // 2. Event handlers trigger
  // 3. Observable emits (with async pipe)
}
```

### 2. TrackBy Function

```typescript
// Component
trackByFn(index: number, item: any): number {
  return item.id; // Unique identifier
}

// Template
<div *ngFor="let item of items; trackBy: trackByFn">
  {{ item.name }}
</div>
```

### 3. Lazy Loading Modules

```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  }
];
```

### 4. Virtual Scrolling (for large lists)

```typescript
// Install @angular/cdk
// npm install @angular/cdk

// Module
import { ScrollingModule } from '@angular/cdk/scrolling';

// Template
<cdk-virtual-scroll-viewport itemSize="50" class="viewport">
  <div *cdkVirtualFor="let item of items" class="item">
    {{ item.name }}
  </div>
</cdk-virtual-scroll-viewport>
```

---

## 🔐 Security Checklist

- [ ] JWT tokens stored securely (HttpOnly cookies preferred, or LocalStorage với encryption)
- [ ] HTTPS in production
- [ ] Input validation trên cả client và server
- [ ] XSS protection (Angular tự động escape, nhưng cẩn thận với innerHTML)
- [ ] CSRF protection
- [ ] Rate limiting trên API
- [ ] Không log sensitive data (passwords, tokens)
- [ ] Regular dependency updates
- [ ] Authentication guards trên sensitive routes
- [ ] Role-based access control

---

## 📞 Support & Resources

### Official Documentation
- [Angular Docs](https://angular.io/docs)
- [RxJS Docs](https://rxjs.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

### Community Resources
- [Stack Overflow - Angular](https://stackoverflow.com/questions/tagged/angular)
- [Angular GitHub](https://github.com/angular/angular)
- [Angular Blog](https://blog.angular.io/)

### Internal Documentation
- `PROJECT_FLOW.md` - Project flow và architecture
- `IMPLEMENTATION_GUIDE.md` - Hướng dẫn implement features mới
- `API_INTEGRATION_GUIDE.md` - API integration patterns

---

## 📝 Changelog

### Version 1.0.0 (30/01/2026)
- Initial setup với Angular 15
- Authentication flow (Login/Logout)
- Dashboard page
- Warehouse management page
- JWT interceptor
- Error handling interceptor
- Auth & Guest guards
- Toastr notifications

### Upcoming Features
- [ ] Product management
- [ ] Inventory management
- [ ] Order management
- [ ] User management (Admin)
- [ ] Reports & Analytics
- [ ] Settings page

---

**Happy Coding! 🚀**
