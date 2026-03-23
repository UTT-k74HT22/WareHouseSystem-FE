# Warehouse Management System - Frontend Flow

## 📋 Tổng quan dự án

Đây là ứng dụng quản lý kho hàng (Warehouse Management System) được xây dựng bằng Angular 15. Hệ thống cung cấp giao diện người dùng để quản lý các hoạt động liên quan đến kho hàng, bao gồm đăng nhập, quản lý thông tin kho, theo dõi hàng tồn kho, và nhiều chức năng khác.

## 🏗️ Kiến trúc tổng quan

```
Frontend (Angular 15)
    ↓
JWT Authentication
    ↓
HTTP Interceptors (JWT, Error)
    ↓
Guards (Auth, Guest)
    ↓
Services (Business Logic)
    ↓
Components (UI)
```

## 🔄 Flow hoạt động chính

### 1. Authentication Flow (Luồng xác thực)

#### 1.1. Login Flow
```
User → Login Component → Auth Service → Backend API
                              ↓
                        Save to LocalStorage
                              ↓
                        Update Auth State (BehaviorSubject)
                              ↓
                        Navigate to Dashboard
```

**Chi tiết từng bước:**

1. **User nhập thông tin đăng nhập** (username/password) vào LoginComponent
2. **LoginComponent gọi AuthService.login()**
   - Gửi LoginRequest đến backend API (`POST /api/v1/auth/login`)
3. **Backend trả về AuthResponse** chứa:
   - accessToken (JWT)
   - refreshToken
   - User information (id, username, roles, etc.)
4. **AuthService xử lý response:**
   - Map AuthResponse → AuthTokens (qua AuthMapper)
   - Lưu tokens vào LocalStorage (qua AuthStorageService)
   - Update authState$ (BehaviorSubject) để notify toàn app
5. **Angular Router điều hướng** đến Dashboard
6. **Các components subscribe authState$** để cập nhật UI

#### 1.2. Session Restore Flow (Khôi phục phiên)
```
Page Refresh/F5
    ↓
AuthService Constructor
    ↓
Check LocalStorage for tokens
    ↓
If tokens exist → Restore Auth State
    ↓
Components automatically update via authState$
```

#### 1.3. Logout Flow
```
User clicks Logout
    ↓
AuthService.logout()
    ↓
Clear LocalStorage
    ↓
Reset authState$ to initial state
    ↓
Navigate to Login
```

### 2. HTTP Request Flow (Luồng HTTP)

#### 2.1. Request với JWT Token
```
Component/Service makes HTTP call
    ↓
JwtInterceptor intercepts request
    ↓
Check if user has accessToken
    ↓
If yes → Add Authorization header: "Bearer {token}"
    ↓
Send request to Backend
    ↓
ErrorInterceptor handles errors if any
    ↓
Return response to Component
```

**Chi tiết:**
- **JwtInterceptor** tự động thêm JWT token vào header của mọi request
- **ErrorInterceptor** xử lý lỗi HTTP (401, 403, 500, etc.) và hiển thị thông báo

#### 2.2. Error Handling Flow
```
Backend returns error (4xx, 5xx)
    ↓
ErrorInterceptor catches error
    ↓
Based on status code:
    - 401 → Unauthorized → Logout & redirect to Login
    - 403 → Forbidden → Show "No permission" message
    - 500 → Server Error → Show error message
    ↓
Display Toastr notification
```

### 3. Routing & Guard Flow (Luồng điều hướng)

#### 3.1. Protected Route (Yêu cầu đăng nhập)
```
User navigates to /dashboard
    ↓
AuthGuard.canActivate()
    ↓
Check authState.isAuthenticated
    ↓
If TRUE:
    - Check role-based permissions (if required)
    - Allow access
If FALSE:
    - Show "Please login" message
    - Navigate to /login with returnUrl
```

#### 3.2. Guest Route (Chỉ cho người chưa đăng nhập)
```
User navigates to /login
    ↓
GuestGuard.canActivate()
    ↓
Check authState.isAuthenticated
    ↓
If TRUE:
    - Already logged in
    - Redirect to /dashboard
If FALSE:
    - Allow access to login/register
```

### 4. State Management Flow (Quản lý trạng thái)

```
AuthService maintains authState$ (BehaviorSubject)
    ↓
Components subscribe to authState$
    ↓
When login/logout occurs:
    - authState$ emits new value
    - All subscribed components auto-update
    ↓
Example: Header shows username, logout button
```

**AuthState structure:**
```typescript
{
  isAuthenticated: boolean,
  user: {
    id: number,
    username: string,
    email: string,
    fullName: string
  },
  roles: string[],
  tokens: {
    accessToken: string,
    refreshToken: string
  }
}
```

## 📂 Cấu trúc thư mục và chức năng

### `/authenticate` - Xác thực
- **login/**: Component đăng nhập
- **register/**: Component đăng ký (chưa hoàn thiện)

### `/dto` - Data Transfer Objects
- **ApiResponse.ts**: Generic wrapper cho tất cả API responses
- **Warehouse.ts**: Interface cho Warehouse entity
- **request/**: Chứa các request DTOs
- **response/**: Chứa các response DTOs

### `/helper` - Utilities
- **mapper/Authmapper.ts**: Map giữa AuthResponse và AuthState/AuthTokens

### `/pages` - Các trang chính
- **dashboard/**: Trang tổng quan
- **warehouse/**: Trang quản lý kho

### `/security` - Bảo mật
- **guards/**: AuthGuard, GuestGuard (kiểm soát truy cập routes)
- **interceptors/**: JwtInterceptor, ErrorInterceptor

### `/service` - Business Logic
- **AuthService/**: Xử lý authentication
  - **AuthStorage/**: Lưu trữ tokens trong LocalStorage
- **SystemService/**: Toastr notifications
- **WarehouseService/**: API calls cho Warehouse

### `/share` - Shared Components
- **layout/**: Header, Footer, Sidebar
- **toastr/**: Toast notification component

## 🔐 Security Features

1. **JWT Authentication**: Token-based authentication
2. **HTTP Interceptors**: Auto-inject JWT tokens
3. **Route Guards**: Protect routes based on auth status
4. **Role-based Access Control**: Check user roles before allowing access
5. **Session Persistence**: Auto-restore session on page refresh
6. **Error Handling**: Centralized error handling with user-friendly messages

## 🚀 Application Lifecycle

```
1. App Initialization
   └─ main.ts bootstraps AppModule
   └─ AuthService constructor runs
   └─ Restore session from LocalStorage (if available)

2. User visits site
   └─ Router checks Guards
   └─ If not authenticated → Redirect to /login
   └─ If authenticated → Allow access to protected routes

3. User logs in
   └─ Tokens saved to LocalStorage
   └─ Auth state updated
   └─ All components reactively update
   └─ Navigate to Dashboard

4. User makes requests
   └─ JwtInterceptor adds token to headers
   └─ Backend validates token
   └─ Return data or error

5. User logs out
   └─ Clear all auth data
   └─ Redirect to Login

6. Page refresh (F5)
   └─ AuthService auto-restores session
   └─ User remains logged in
```

## 📊 Data Flow Example: Warehouse Management

```
1. User navigates to /warehouse
   └─ AuthGuard verifies authentication
   └─ WarehouseComponent loads

2. Component ngOnInit()
   └─ Call WarehouseService.getWarehouses()
   
3. WarehouseService
   └─ HTTP GET to /api/v1/warehouses
   └─ JwtInterceptor adds JWT token
   
4. Backend returns ApiResponse<Warehouse[]>
   
5. Component receives data
   └─ Update component state
   └─ Render warehouse list in template

6. User clicks "Edit Warehouse"
   └─ Call WarehouseService.updateWarehouse(id, data)
   └─ HTTP PUT to /api/v1/warehouses/{id}
   └─ Show success/error Toastr
   └─ Refresh list
```

## 🔧 Technical Stack

- **Framework**: Angular 15.2
- **Language**: TypeScript 4.9
- **HTTP Client**: @angular/common/http
- **Routing**: @angular/router
- **Reactive Programming**: RxJS 7.8
- **Notifications**: ngx-toastr 16.0
- **JWT Handling**: jwt-decode 4.0
- **UI Components**: Angular CDK 15.2

## 📝 API Communication Pattern

Tất cả API responses tuân theo chuẩn ApiResponse:

```typescript
{
  success: boolean,           // true/false
  error_code: string | null,  // Mã lỗi (nếu có)
  message: string | null,     // Thông báo
  data: T,                    // Dữ liệu chính
  field_errors: any,          // Lỗi validation
  timestamp: string           // Thời gian response
}
```

Ví dụ:
- **Success**: `success: true, data: {...}`
- **Error**: `success: false, error_code: "AUTH_001", message: "Invalid credentials"`

## 🎯 Best Practices được áp dụng

1. **Separation of Concerns**: Components, Services, DTOs, Guards riêng biệt
2. **Reactive Programming**: Sử dụng Observables và BehaviorSubject
3. **Type Safety**: Strong typing với TypeScript interfaces
4. **DRY Principle**: Interceptors tự động xử lý JWT và errors
5. **Security First**: Guards bảo vệ routes, JWT cho authentication
6. **User Experience**: Toastr notifications, auto session restore
7. **Maintainability**: Clear folder structure, meaningful naming

---

**Lưu ý**: Document này mô tả flow hiện tại của dự án. Xem thêm `IMPLEMENTATION_GUIDE.md` để biết cách triển khai các tính năng mới.
