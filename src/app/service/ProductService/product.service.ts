import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { CreateProductRequest } from '../../dto/request/Product/CreateProductRequest';
import { UpdateProductRequest } from '../../dto/request/Product/UpdateProductRequest';
import { SearchProductRequest } from '../../dto/request/Product/SearchProductRequest';
import { FileUploadResponse } from '../../dto/response/Storage/FileUploadResponse';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = `${BaseURL.API_URL}products`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/products?page=&size= */
  getAll(page = 0, size = 10): Observable<ApiResponse<PageResponse<ProductResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<ProductResponse>>>(this.apiUrl, { params });
  }

  /** GET /api/v1/products/:id */
  getById(id: string): Observable<ApiResponse<ProductResponse>> {
    return this.http.get<ApiResponse<ProductResponse>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Lấy toàn bộ sản phẩm cho dropdown/danh sách tham chiếu.
   * Tự phân trang theo size tối đa BE cho phép (100) rồi gộp lại.
   */
  getFullList(): Observable<ProductResponse[]> {
    const pageSize = 100;
    return this.getAll(0, pageSize).pipe(
      switchMap((response) => {
        if (!response.success) {
          return of([]);
        }
        const firstPage = response.data.content || [];
        if (response.data.total_pages <= 1) {
          return of(firstPage);
        }
        const remaining = Array.from({ length: response.data.total_pages - 1 }, (_, index) =>
          this.getAll(index + 1, pageSize).pipe(
            map((page) => page.success ? page.data.content : []),
            catchError(() => of([]))
          )
        );
        return forkJoin(remaining).pipe(map((pages) => firstPage.concat(...pages)));
      })
    );
  }

  /** GET /api/v1/products/sku/:sku */
  getBySku(sku: string): Observable<ApiResponse<ProductResponse>> {
    return this.http.get<ApiResponse<ProductResponse>>(`${this.apiUrl}/sku/${sku}`);
  }

  /** GET /api/v1/products/category/:categoryId */
  getByCategory(categoryId: string, page = 0, size = 10): Observable<ApiResponse<PageResponse<ProductResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<ProductResponse>>>(
      `${this.apiUrl}/category/${categoryId}`, { params }
    );
  }

  /** GET /api/v1/products/batch-tracking */
  getBatchTracking(page = 0, size = 10): Observable<ApiResponse<PageResponse<ProductResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<ProductResponse>>>(
      `${this.apiUrl}/batch-tracking`, { params }
    );
  }

  /** POST /api/v1/products/search */
  search(request: SearchProductRequest, page = 0, size = 10): Observable<ApiResponse<PageResponse<ProductResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.post<ApiResponse<PageResponse<ProductResponse>>>(
      `${this.apiUrl}/search`, request, { params }
    );
  }

  /** POST /api/v1/products */
  create(request: CreateProductRequest): Observable<ApiResponse<ProductResponse>> {
    return this.http.post<ApiResponse<ProductResponse>>(this.apiUrl, request);
  }

  /** PUT /api/v1/products/:id */
  update(id: string, request: UpdateProductRequest): Observable<ApiResponse<ProductResponse>> {
    return this.http.put<ApiResponse<ProductResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** DELETE /api/v1/products/:id */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  uploadImage(file: File): Observable<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<FileUploadResponse>>(`${this.apiUrl}/images`, formData);
  }

  uploadImageForUpdate(productId: string, file: File): Observable<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<FileUploadResponse>>(`${this.apiUrl}/${productId}/image`, formData);
  }

  getImageUrl(productId: string): Observable<ApiResponse<{ presignedUrl: string }>> {
    return this.http.get<ApiResponse<{ presignedUrl: string }>>(`${this.apiUrl}/${productId}/image-url`);
  }
}
