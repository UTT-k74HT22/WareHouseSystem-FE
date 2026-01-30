# API Integration & Architecture Guide

## 📋 Tổng quan

Document này mô tả chi tiết cách tích hợp API, cấu trúc dữ liệu, và các pattern được sử dụng trong dự án Warehouse Management System.

---

## 🌐 API Configuration

### Base URL Configuration

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1'
};

// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.warehouse.com/api/v1'
};
```

### Service Template

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BaseService {
  protected readonly apiUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}
}
```

---

## 📦 DTO Pattern

### Standard API Response Wrapper

Tất cả API responses được wrap trong `ApiResponse<T>`:

```typescript
// dto/ApiResponse.ts
export interface ApiResponse<T> {
  success: boolean;           // true nếu request thành công
  error_code: string | null;  // Mã lỗi (nếu có): "AUTH_001", "VALIDATION_001"
  message: string | null;     // Thông báo cho user
  data: T;                    // Dữ liệu chính (generic type)
  field_errors: FieldError[]; // Lỗi validation từng field
  timestamp: string;          // ISO timestamp
}

export interface FieldError {
  field: string;    // Tên field bị lỗi
  message: string;  // Thông báo lỗi
}
```

### Request DTOs

```typescript
// dto/request/[Module]/[Action]Request.ts

// Example: CreateProductRequest
export interface CreateProductRequest {
  code: string;
  name: string;
  description?: string;  // Optional field
  category: string;
  price: number;
  quantity: number;
  warehouseId: number;
}

// Example: UpdateProductRequest
export interface UpdateProductRequest {
  name?: string;         // Tất cả fields optional
  description?: string;
  price?: number;
  quantity?: number;
  status?: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
}

// Example: SearchProductRequest
export interface SearchProductRequest {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  warehouseId?: number;
  page?: number;
  size?: number;
  sort?: string;
}
```

### Response DTOs

```typescript
// dto/response/[Module]/[Entity]Response.ts

// Single entity response
export interface ProductResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  warehouse: WarehouseBasicInfo;  // Nested object
  status: ProductStatus;
  createdBy: string;
  createdDate: string;  // ISO date string
  lastUpdatedBy: string;
  lastUpdated: string;
}

// List response với pagination
export interface ProductListResponse {
  content: ProductResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Statistics/Aggregation response
export interface ProductStatsResponse {
  totalProducts: number;
  availableProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  categoryCounts: CategoryCount[];
}

interface CategoryCount {
  category: string;
  count: number;
}
```

### Entity Models (Domain Objects)

```typescript
// dto/[Entity].ts

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  warehouseId: number;
  status: ProductStatus;
  createdDate: Date;  // Converted to Date object
  lastUpdated: Date;
}

export enum ProductStatus {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED'
}

// Type guards
export function isProduct(obj: any): obj is Product {
  return obj && typeof obj.id === 'number' && typeof obj.code === 'string';
}
```

---

## 🔧 Service Layer Patterns

### Basic CRUD Service

```typescript
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

  // CREATE
  create(request: ProductCreateRequest): Observable<Product> {
    return this.http.post<ApiResponse<Product>>(this.apiUrl, request).pipe(
      map(response => this.mapToProduct(response.data))
    );
  }

  // READ - Get all with pagination
  getAll(page: number = 0, size: number = 10): Observable<ApiResponse<Product[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl, { params });
  }

  // READ - Get by ID
  getById(id: number): Observable<Product> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.mapToProduct(response.data))
    );
  }

  // UPDATE
  update(id: number, request: ProductUpdateRequest): Observable<Product> {
    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, request).pipe(
      map(response => this.mapToProduct(response.data))
    );
  }

  // DELETE
  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  // Helper: Map response to domain model
  private mapToProduct(data: any): Product {
    return {
      ...data,
      createdDate: new Date(data.createdDate),
      lastUpdated: new Date(data.lastUpdated)
    };
  }
}
```

### Advanced Service with Caching

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, shareReplay, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductServiceWithCache {
  private readonly apiUrl = 'http://localhost:8080/api/v1/products';
  private cache$ = new BehaviorSubject<Product[]>([]);
  private cacheTime = 5 * 60 * 1000; // 5 minutes
  private lastFetch: number = 0;

  constructor(private http: HttpClient) {}

  getAll(forceRefresh: boolean = false): Observable<Product[]> {
    const now = Date.now();
    const shouldRefresh = forceRefresh || (now - this.lastFetch > this.cacheTime);

    if (shouldRefresh) {
      return this.fetchFromServer().pipe(
        tap(products => {
          this.cache$.next(products);
          this.lastFetch = now;
        }),
        shareReplay(1) // Share the result với multiple subscribers
      );
    }

    return this.cache$.asObservable();
  }

  private fetchFromServer(): Observable<Product[]> {
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching products:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  // Clear cache khi có thay đổi
  clearCache(): void {
    this.cache$.next([]);
    this.lastFetch = 0;
  }
}
```

### Service with Search & Filter

```typescript
@Injectable({
  providedIn: 'root'
})
export class ProductSearchService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/products';

  constructor(private http: HttpClient) {}

  search(filters: ProductSearchFilters): Observable<Product[]> {
    let params = new HttpParams();

    // Dynamically add parameters
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/search`, { params }).pipe(
      map(response => response.data)
    );
  }

  // Advanced search với multiple criteria
  advancedSearch(criteria: AdvancedSearchCriteria): Observable<SearchResult> {
    return this.http.post<ApiResponse<SearchResult>>(
      `${this.apiUrl}/advanced-search`,
      criteria
    ).pipe(
      map(response => response.data)
    );
  }
}

export interface ProductSearchFilters {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  warehouseId?: number;
}

export interface AdvancedSearchCriteria {
  filters: ProductSearchFilters;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page?: number;
  size?: number;
}

export interface SearchResult {
  products: Product[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
}
```

---

## 🔒 Security Integration

### JWT Token Handling

```typescript
// security/interceptors/jwt.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../service/AuthService/auth-service.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getAccessToken();
    
    // Skip token for auth endpoints
    if (this.isAuthEndpoint(req.url)) {
      return next.handle(req);
    }

    // Add token to request
    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return next.handle(cloned);
    }

    return next.handle(req);
  }

  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }
}
```

### Error Interceptor with Retry

```typescript
// security/interceptors/error.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { AuthService } from '../../service/AuthService/auth-service.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private authService: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry({
        count: 2,
        delay: 1000,
        resetOnSuccess: true
      }),
      catchError((error: HttpErrorResponse) => {
        return this.handleError(error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Có lỗi xảy ra';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Lỗi: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = this.handleBadRequest(error);
          break;
        case 401:
          errorMessage = 'Phiên đăng nhập hết hạn';
          this.authService.logout();
          this.router.navigate(['/login']);
          break;
        case 403:
          errorMessage = 'Bạn không có quyền thực hiện thao tác này';
          break;
        case 404:
          errorMessage = 'Không tìm thấy dữ liệu';
          break;
        case 500:
          errorMessage = 'Lỗi server. Vui lòng thử lại sau';
          break;
        case 503:
          errorMessage = 'Dịch vụ đang bảo trì';
          break;
        default:
          errorMessage = `Lỗi: ${error.message}`;
      }
    }

    this.toastr.error('Lỗi', errorMessage);
    return throwError(() => error);
  }

  private handleBadRequest(error: HttpErrorResponse): string {
    const apiResponse = error.error as ApiResponse<any>;
    
    if (apiResponse && apiResponse.field_errors && apiResponse.field_errors.length > 0) {
      // Show field validation errors
      const fieldErrors = apiResponse.field_errors
        .map(fe => `${fe.field}: ${fe.message}`)
        .join('\n');
      return fieldErrors;
    }

    return apiResponse?.message || 'Dữ liệu không hợp lệ';
  }
}
```

---

## 🎨 Component Integration Patterns

### Smart vs Dumb Components

#### Smart Component (Container)
```typescript
// pages/product-list/product-list.component.ts
@Component({
  selector: 'app-product-list',
  template: `
    <app-product-table
      [products]="products$ | async"
      [loading]="loading$ | async"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)">
    </app-product-table>
  `
})
export class ProductListComponent implements OnInit {
  products$ = this.productService.getAll();
  loading$ = this.productService.loading$;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.loadProducts();
  }

  onEdit(product: Product): void {
    // Handle edit logic
  }

  onDelete(id: number): void {
    // Handle delete logic
  }
}
```

#### Dumb Component (Presentational)
```typescript
// components/product-table/product-table.component.ts
@Component({
  selector: 'app-product-table',
  templateUrl: './product-table.component.html',
  styleUrls: ['./product-table.component.css']
})
export class ProductTableComponent {
  @Input() products: Product[] = [];
  @Input() loading: boolean = false;
  
  @Output() edit = new EventEmitter<Product>();
  @Output() delete = new EventEmitter<number>();

  onEditClick(product: Product): void {
    this.edit.emit(product);
  }

  onDeleteClick(id: number): void {
    this.delete.emit(id);
  }
}
```

### Observable Data Pattern

```typescript
// Component
export class ProductComponent implements OnInit {
  products$: Observable<Product[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(private productService: ProductService) {
    this.products$ = this.productService.products$;
    this.loading$ = this.productService.loading$;
    this.error$ = this.productService.error$;
  }

  ngOnInit(): void {
    this.productService.loadProducts();
  }
}

// Service with state management
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  products$ = this.productsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadProducts(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.http.get<ApiResponse<Product[]>>(this.apiUrl).subscribe({
      next: (response) => {
        this.productsSubject.next(response.data);
        this.loadingSubject.next(false);
      },
      error: (error) => {
        this.errorSubject.next('Failed to load products');
        this.loadingSubject.next(false);
      }
    });
  }
}

// Template
<div *ngIf="loading$ | async">Loading...</div>
<div *ngIf="error$ | async as error" class="error">{{ error }}</div>
<div *ngIf="products$ | async as products">
  <div *ngFor="let product of products">
    {{ product.name }}
  </div>
</div>
```

---

## 🧪 Testing API Integration

### Service Unit Test

```typescript
// product.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { ApiResponse } from '../../dto/ApiResponse';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding requests
  });

  it('should fetch products', () => {
    const mockProducts = [
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' }
    ];

    const mockResponse: ApiResponse<any[]> = {
      success: true,
      error_code: null,
      message: null,
      data: mockProducts,
      field_errors: [],
      timestamp: new Date().toISOString()
    };

    service.getAll().subscribe(response => {
      expect(response.data.length).toBe(2);
      expect(response.data).toEqual(mockProducts);
    });

    const req = httpMock.expectOne(service['apiUrl']);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle error', () => {
    service.getById(1).subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(404);
      }
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/1`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });
});
```

---

## 📚 Common Patterns & Solutions

### Pattern 1: Optimistic Update

```typescript
deleteProduct(id: number): void {
  // Immediately remove from UI
  const currentProducts = this.productsSubject.value;
  const optimisticProducts = currentProducts.filter(p => p.id !== id);
  this.productsSubject.next(optimisticProducts);

  // Call API
  this.http.delete(`${this.apiUrl}/${id}`).subscribe({
    next: () => {
      this.toastr.success('Deleted successfully');
    },
    error: (error) => {
      // Rollback on error
      this.productsSubject.next(currentProducts);
      this.toastr.error('Delete failed');
    }
  });
}
```

### Pattern 2: Debounced Search

```typescript
// Component
searchControl = new FormControl('');

ngOnInit(): void {
  this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(keyword => this.productService.search(keyword))
  ).subscribe(products => {
    this.products = products;
  });
}
```

### Pattern 3: Polling for Updates

```typescript
ngOnInit(): void {
  // Poll every 30 seconds
  interval(30000).pipe(
    startWith(0),
    switchMap(() => this.productService.getAll()),
    takeUntil(this.destroy$)
  ).subscribe(products => {
    this.products = products;
  });
}
```

### Pattern 4: Parallel Requests

```typescript
loadDashboardData(): void {
  forkJoin({
    products: this.productService.getAll(),
    warehouses: this.warehouseService.getAll(),
    stats: this.dashboardService.getStats()
  }).subscribe({
    next: (result) => {
      this.products = result.products.data;
      this.warehouses = result.warehouses.data;
      this.stats = result.stats.data;
    },
    error: (error) => {
      this.toastr.error('Failed to load dashboard');
    }
  });
}
```

### Pattern 5: Sequential Requests

```typescript
createOrderWithItems(): void {
  // First create order
  this.orderService.create(this.orderData).pipe(
    // Then add items using the order ID
    switchMap(order => 
      this.orderItemService.addItems(order.id, this.items)
    ),
    // Then update inventory
    switchMap(items => 
      this.inventoryService.updateStock(items)
    )
  ).subscribe({
    next: () => {
      this.toastr.success('Order created successfully');
    },
    error: (error) => {
      this.toastr.error('Order creation failed');
    }
  });
}
```

---

## 🎯 API Documentation Format

Khi implement API mới, tạo documentation theo format sau:

```typescript
/**
 * API: Get Product List
 * 
 * Endpoint: GET /api/v1/products
 * 
 * Query Parameters:
 * - page: number (default: 0)
 * - size: number (default: 10)
 * - sort: string (example: "name,asc")
 * 
 * Response: ApiResponse<Product[]>
 * 
 * Success Example:
 * {
 *   "success": true,
 *   "data": [{ id: 1, name: "Product 1", ... }],
 *   "message": null,
 *   "error_code": null,
 *   "field_errors": [],
 *   "timestamp": "2026-01-30T10:00:00Z"
 * }
 * 
 * Error Codes:
 * - PRODUCT_001: Product not found
 * - PRODUCT_002: Invalid product data
 */
```

---

**Version**: 1.0.0  
**Last Updated**: 30/01/2026  
**Maintainer**: Development Team
