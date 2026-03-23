# Hướng dẫn triển khai các màn hình tiếp theo

## 📋 Mục lục
1. [Quy trình tạo màn hình mới](#quy-trình-tạo-màn-hình-mới)
2. [Tạo CRUD đơn giản](#tạo-crud-đơn-giản)
3. [Tích hợp API](#tích-hợp-api)
4. [Best Practices](#best-practices)
5. [Checklist triển khai](#checklist-triển-khai)

---

## 🚀 Quy trình tạo màn hình mới

### Bước 1: Tạo Component

```bash
# Tạo component trong thư mục pages
ng generate component pages/ten-man-hinh

# Ví dụ: Tạo màn Product
ng generate component pages/product
```

Lệnh này sẽ tạo:
- `product.component.ts` - Logic
- `product.component.html` - Template
- `product.component.css` - Styles
- `product.component.spec.ts` - Tests

### Bước 2: Tạo DTO (Data Transfer Objects)

Tạo file trong `src/app/dto/`:

```typescript
// dto/Product.ts
export interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  warehouseId: number;
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  createdDate: Date;
  lastUpdated: Date;
}

export interface ProductCreateRequest {
  code: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  quantity: number;
  warehouseId: number;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  status?: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
}
```

### Bước 3: Tạo Service

```bash
# Tạo service
ng generate service service/ProductService/product
```

Implement service:

```typescript
// service/ProductService/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../dto/ApiResponse';
import { Product, ProductCreateRequest, ProductUpdateRequest } from '../../dto/Product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/products';

  constructor(private http: HttpClient) {}

  // GET all products
  getProducts(page: number = 0, size: number = 10): Observable<ApiResponse<Product[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl, { params });
  }

  // GET product by ID
  getProductById(id: number): Observable<Product> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  // POST create new product
  createProduct(request: ProductCreateRequest): Observable<Product> {
    return this.http.post<ApiResponse<Product>>(this.apiUrl, request).pipe(
      map(response => response.data)
    );
  }

  // PUT update product
  updateProduct(id: number, request: ProductUpdateRequest): Observable<Product> {
    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, request).pipe(
      map(response => response.data)
    );
  }

  // DELETE product
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  // Search products
  searchProducts(keyword: string): Observable<Product[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/search`, { params }).pipe(
      map(response => response.data)
    );
  }
}
```

### Bước 4: Implement Component

```typescript
// pages/product/product.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Product } from '../../dto/Product';
import { ProductService } from '../../service/ProductService/product.service';
import { ToastrService } from '../../service/SystemService/toastr.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.products = response.data;
          this.loading = false;
          // Nếu API có pagination info
          // this.totalPages = response.totalPages;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.toastr.error('Lỗi', 'Không thể tải danh sách sản phẩm');
          this.loading = false;
        }
      });
  }

  onEdit(product: Product): void {
    // TODO: Open edit modal or navigate to edit page
    console.log('Edit product:', product);
  }

  onDelete(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      this.productService.deleteProduct(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Thành công', 'Đã xóa sản phẩm');
            this.loadProducts(); // Reload list
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            this.toastr.error('Lỗi', 'Không thể xóa sản phẩm');
          }
        });
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProducts();
  }
}
```

### Bước 5: Tạo HTML Template

```html
<!-- pages/product/product.component.html -->
<div class="product-container">
  <div class="header">
    <h2>Quản lý Sản phẩm</h2>
    <button class="btn btn-primary" (click)="onAdd()">
      <i class="icon-plus"></i> Thêm sản phẩm
    </button>
  </div>

  <!-- Loading spinner -->
  <div *ngIf="loading" class="loading-spinner">
    <p>Đang tải...</p>
  </div>

  <!-- Product table -->
  <div *ngIf="!loading" class="table-container">
    <table class="table">
      <thead>
        <tr>
          <th>Mã SP</th>
          <th>Tên sản phẩm</th>
          <th>Danh mục</th>
          <th>Giá</th>
          <th>Số lượng</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let product of products">
          <td>{{ product.code }}</td>
          <td>{{ product.name }}</td>
          <td>{{ product.category }}</td>
          <td>{{ product.price | currency:'VND' }}</td>
          <td>{{ product.quantity }}</td>
          <td>
            <span [ngClass]="getStatusClass(product.status)">
              {{ product.status }}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-edit" (click)="onEdit(product)">
              Sửa
            </button>
            <button class="btn btn-sm btn-delete" (click)="onDelete(product.id)">
              Xóa
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Empty state -->
    <div *ngIf="products.length === 0" class="empty-state">
      <p>Không có sản phẩm nào</p>
    </div>
  </div>

  <!-- Pagination -->
  <div class="pagination" *ngIf="totalPages > 1">
    <button 
      [disabled]="currentPage === 0" 
      (click)="onPageChange(currentPage - 1)">
      Trước
    </button>
    <span>Trang {{ currentPage + 1 }} / {{ totalPages }}</span>
    <button 
      [disabled]="currentPage === totalPages - 1" 
      (click)="onPageChange(currentPage + 1)">
      Sau
    </button>
  </div>
</div>
```

### Bước 6: Thêm Route

Cập nhật `app-routing.module.ts`:

```typescript
import { ProductComponent } from './pages/product/product.component';

const routes: Routes = [
  // ...existing routes...
  
  {
    path: 'products',
    component: ProductComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Quản lý Sản phẩm',
      subtitle: 'Danh sách và thông tin sản phẩm'
    }
  },
  
  // ...rest of routes...
];
```

### Bước 7: Cập nhật Module

Nếu cần import thêm modules (Forms, Material, etc.), cập nhật `app.module.ts`:

```typescript
import { ProductComponent } from './pages/product/product.component';

@NgModule({
  declarations: [
    // ...existing components...
    ProductComponent
  ],
  imports: [
    // ...existing modules...
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Bước 8: Thêm link vào Sidebar

Cập nhật `share/layout/sidebar/sidebar.component.html`:

```html
<nav class="sidebar-nav">
  <a routerLink="/dashboard" routerLinkActive="active">
    <i class="icon-dashboard"></i> Dashboard
  </a>
  <a routerLink="/warehouse" routerLinkActive="active">
    <i class="icon-warehouse"></i> Kho hàng
  </a>
  <a routerLink="/products" routerLinkActive="active">
    <i class="icon-product"></i> Sản phẩm
  </a>
</nav>
```

---

## 🔨 Tạo CRUD đơn giản

### Template Component với CRUD đầy đủ

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-crud-example',
  templateUrl: './crud-example.component.html',
  styleUrls: ['./crud-example.component.css']
})
export class CrudExampleComponent implements OnInit, OnDestroy {
  items: any[] = [];
  itemForm: FormGroup;
  isEditing = false;
  editingId: number | null = null;
  showModal = false;
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private itemService: YourService,
    private toastr: ToastrService
  ) {
    this.itemForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      // Add more fields as needed
    });
  }

  ngOnInit(): void {
    this.loadItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // CREATE
  onAdd(): void {
    this.isEditing = false;
    this.editingId = null;
    this.itemForm.reset();
    this.showModal = true;
  }

  // READ
  loadItems(): void {
    this.loading = true;
    this.itemService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.items = response.data;
          this.loading = false;
        },
        error: (error) => {
          this.toastr.error('Lỗi', 'Không thể tải dữ liệu');
          this.loading = false;
        }
      });
  }

  // UPDATE
  onEdit(item: any): void {
    this.isEditing = true;
    this.editingId = item.id;
    this.itemForm.patchValue(item);
    this.showModal = true;
  }

  // DELETE
  onDelete(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa?')) {
      this.itemService.delete(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Thành công', 'Đã xóa');
            this.loadItems();
          },
          error: (error) => {
            this.toastr.error('Lỗi', 'Không thể xóa');
          }
        });
    }
  }

  // SUBMIT FORM (Create or Update)
  onSubmit(): void {
    if (this.itemForm.invalid) {
      this.toastr.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    const formData = this.itemForm.value;
    const request$ = this.isEditing
      ? this.itemService.update(this.editingId!, formData)
      : this.itemService.create(formData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const message = this.isEditing ? 'Đã cập nhật' : 'Đã thêm mới';
        this.toastr.success('Thành công', message);
        this.showModal = false;
        this.loadItems();
        this.itemForm.reset();
      },
      error: (error) => {
        this.toastr.error('Lỗi', 'Thao tác không thành công');
      }
    });
  }

  onCancel(): void {
    this.showModal = false;
    this.itemForm.reset();
  }
}
```

---

## 🔗 Tích hợp API

### Xử lý các case thường gặp

#### 1. API với Pagination

```typescript
getItemsPaginated(page: number, size: number, sort?: string): Observable<PaginatedResponse<Item>> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString());
  
  if (sort) {
    params = params.set('sort', sort);
  }

  return this.http.get<ApiResponse<PaginatedResponse<Item>>>(
    `${this.apiUrl}/items`, 
    { params }
  ).pipe(
    map(response => response.data)
  );
}

// DTO cho Pagination
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

#### 2. API với Search/Filter

```typescript
searchItems(filters: SearchFilters): Observable<Item[]> {
  let params = new HttpParams();
  
  if (filters.keyword) {
    params = params.set('keyword', filters.keyword);
  }
  if (filters.category) {
    params = params.set('category', filters.category);
  }
  if (filters.status) {
    params = params.set('status', filters.status);
  }
  
  return this.http.get<ApiResponse<Item[]>>(
    `${this.apiUrl}/items/search`,
    { params }
  ).pipe(
    map(response => response.data)
  );
}
```

#### 3. Upload File

```typescript
uploadFile(file: File): Observable<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file, file.name);
  
  return this.http.post<ApiResponse<UploadResponse>>(
    `${this.apiUrl}/upload`,
    formData
  ).pipe(
    map(response => response.data)
  );
}
```

#### 4. Download File

```typescript
downloadFile(fileId: string): Observable<Blob> {
  return this.http.get(
    `${this.apiUrl}/download/${fileId}`,
    { responseType: 'blob' }
  );
}

// Trong component
onDownload(fileId: string, fileName: string): void {
  this.fileService.downloadFile(fileId).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: (error) => {
      this.toastr.error('Lỗi', 'Không thể tải file');
    }
  });
}
```

---

## ✅ Best Practices

### 1. Memory Leak Prevention

**❌ BAD - Memory leak:**
```typescript
ngOnInit() {
  this.service.getData().subscribe(data => {
    this.data = data;
  });
}
```

**✅ GOOD - Use takeUntil:**
```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => {
      this.data = data;
    });
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### 2. Error Handling

**✅ GOOD:**
```typescript
this.service.getData()
  .pipe(
    takeUntil(this.destroy$),
    catchError(error => {
      console.error('Error:', error);
      this.toastr.error('Lỗi', 'Không thể tải dữ liệu');
      return of([]); // Return empty array as fallback
    })
  )
  .subscribe(data => {
    this.data = data;
    this.loading = false;
  });
```

### 3. Loading States

```typescript
// Component
isLoading = false;
data: Item[] = [];

loadData(): void {
  this.isLoading = true;
  this.service.getData()
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false) // Always runs
    )
    .subscribe({
      next: (response) => {
        this.data = response.data;
      },
      error: (error) => {
        this.toastr.error('Lỗi', 'Không thể tải dữ liệu');
      }
    });
}
```

```html
<!-- Template -->
<div *ngIf="isLoading" class="spinner">Loading...</div>
<div *ngIf="!isLoading && data.length > 0">
  <!-- Display data -->
</div>
<div *ngIf="!isLoading && data.length === 0" class="empty-state">
  Không có dữ liệu
</div>
```

### 4. Form Validation

```typescript
// Component
createForm(): void {
  this.form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, {
    validators: this.passwordMatchValidator // Custom validator
  });
}

passwordMatchValidator(group: FormGroup): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

// Template
<div class="form-group">
  <input formControlName="email" />
  <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched" 
       class="error-message">
    <span *ngIf="form.get('email')?.hasError('required')">
      Email là bắt buộc
    </span>
    <span *ngIf="form.get('email')?.hasError('email')">
      Email không hợp lệ
    </span>
  </div>
</div>
```

### 5. Reactive UI Updates

```typescript
// Service with BehaviorSubject
export class DataService {
  private dataSubject = new BehaviorSubject<Item[]>([]);
  data$ = this.dataSubject.asObservable();

  loadData(): void {
    this.http.get<ApiResponse<Item[]>>(this.apiUrl).subscribe(
      response => this.dataSubject.next(response.data)
    );
  }

  addItem(item: Item): void {
    const current = this.dataSubject.value;
    this.dataSubject.next([...current, item]);
  }
}

// Component
data$ = this.dataService.data$; // Observable

// Template với async pipe
<div *ngFor="let item of data$ | async">
  {{ item.name }}
</div>
```

---

## 📋 Checklist triển khai

Khi tạo màn hình mới, check các items sau:

### Planning Phase
- [ ] Xác định chức năng cần có (CRUD, Search, Filter, etc.)
- [ ] Thiết kế API endpoints cần thiết
- [ ] Xác định DTOs cần tạo
- [ ] Vẽ mockup UI (nếu cần)

### Implementation Phase
- [ ] Tạo Component bằng Angular CLI
- [ ] Tạo DTOs (interfaces) trong `/dto`
- [ ] Tạo Service và implement API calls
- [ ] Implement Component logic
- [ ] Tạo HTML template
- [ ] Thêm CSS styling
- [ ] Thêm route vào `app-routing.module.ts`
- [ ] Thêm guard (AuthGuard) nếu cần bảo vệ
- [ ] Thêm link vào Sidebar/Menu

### Testing Phase
- [ ] Test tất cả CRUD operations
- [ ] Test validation
- [ ] Test error handling
- [ ] Test loading states
- [ ] Test với data rỗng (empty state)
- [ ] Test pagination (nếu có)
- [ ] Test search/filter (nếu có)

### Quality Check
- [ ] Không có memory leaks (dùng takeUntil)
- [ ] Error handling đầy đủ
- [ ] Loading states rõ ràng
- [ ] User-friendly error messages
- [ ] Responsive design
- [ ] Code được format đúng
- [ ] Không có console errors
- [ ] TypeScript strict mode pass

---

## 🎯 Các màn hình nên triển khai tiếp theo

### 1. **Product Management** (Quản lý Sản phẩm)
- CRUD sản phẩm
- Search và filter theo category, status
- Import/Export Excel
- **Priority**: ⭐⭐⭐⭐⭐

### 2. **Inventory Management** (Quản lý Tồn kho)
- Xem tồn kho theo kho
- Nhập/xuất hàng
- Lịch sử xuất nhập
- Cảnh báo tồn kho thấp
- **Priority**: ⭐⭐⭐⭐⭐

### 3. **Supplier Management** (Quản lý Nhà cung cấp)
- CRUD nhà cung cấp
- Lịch sử giao dịch
- Đánh giá nhà cung cấp
- **Priority**: ⭐⭐⭐⭐

### 4. **Order Management** (Quản lý Đơn hàng)
- Tạo đơn hàng
- Theo dõi trạng thái đơn
- In phiếu xuất kho
- **Priority**: ⭐⭐⭐⭐⭐

### 5. **Report & Analytics** (Báo cáo & Phân tích)
- Báo cáo tồn kho
- Báo cáo xuất nhập
- Biểu đồ thống kê
- **Priority**: ⭐⭐⭐

### 6. **User Management** (Quản lý Người dùng) - Admin only
- CRUD users
- Phân quyền
- Xem lịch sử hoạt động
- **Priority**: ⭐⭐⭐⭐

### 7. **Settings** (Cài đặt)
- Thông tin cá nhân
- Đổi mật khẩu
- Cấu hình hệ thống
- **Priority**: ⭐⭐⭐

---

## 🔧 Utilities & Helpers nên tạo

### 1. Pipes (Custom Pipes)
```bash
ng generate pipe pipes/status-text
ng generate pipe pipes/currency-vnd
ng generate pipe pipes/date-format
```

### 2. Validators (Custom Validators)
```typescript
// validators/custom-validators.ts
export class CustomValidators {
  static phoneNumber(control: AbstractControl): ValidationErrors | null {
    const phone = control.value;
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone) ? null : { invalidPhone: true };
  }

  static futureDate(control: AbstractControl): ValidationErrors | null {
    const date = new Date(control.value);
    const today = new Date();
    return date > today ? null : { pastDate: true };
  }
}
```

### 3. Directives (Custom Directives)
```bash
ng generate directive directives/number-only
ng generate directive directives/highlight
```

### 4. Utils Functions
```typescript
// utils/date.utils.ts
export class DateUtils {
  static formatDate(date: Date, format: string = 'dd/MM/yyyy'): string {
    // Implementation
  }

  static getDaysDifference(date1: Date, date2: Date): number {
    // Implementation
  }
}

// utils/string.utils.ts
export class StringUtils {
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static truncate(str: string, length: number): string {
    return str.length > length ? str.substring(0, length) + '...' : str;
  }
}
```

---

## 📚 Tài liệu tham khảo

- [Angular Official Documentation](https://angular.io/docs)
- [RxJS Documentation](https://rxjs.dev/)
- [Angular Style Guide](https://angular.io/guide/styleguide)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Lưu ý**: Document này sẽ được cập nhật khi có pattern hoặc best practice mới được phát hiện trong quá trình development.
