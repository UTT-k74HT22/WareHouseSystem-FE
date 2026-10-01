import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { InventoryResponse } from '../../dto/response/Inventory/InventoryResponse';
import { InventoryFilterRequest } from '../../dto/request/Inventory/InventoryFilterRequest';
import { InventorySummaryResponse } from '../../dto/response/Inventory/InventorySummaryResponse';
import { InventoryByLocationResponse } from '../../dto/response/Inventory/InventoryByLocationResponse';
import { InventoryByProductResponse } from '../../dto/response/Inventory/InventoryByProductResponse';

export interface CheckInventoryAvailabilityRequest {
  product_id: string;
  quantity: number;
  warehouse_id?: string;
  /** Chỉ tính tồn khả dụng tại khu lưu trữ (STORAGE). */
  storage_only?: boolean;
}

export interface CheckInventoryAvailabilityResponse {
  product_id: string;
  warehouse_id: string | null;
  requested_quantity: number;
  available_quantity: number;
  is_available: boolean;
  /** Hỗ trợ phản hồi từ các backend cũ, nơi boolean được serialize là `available`. */
  available?: boolean;
  message: string | null;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly apiUrl = `${BaseURL.API_URL}inventories`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/v1/inventories
   * Supports advanced filtering, sorting, and pagination matching the BE controller.
   */
  getAll(
    page = 0,
    size = 10,
    filters?: InventoryFilterRequest,
    sortBy = 'updatedAt',
    direction: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<InventoryResponse>>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (sortBy) {
      params = params.append('sort', `${sortBy},${direction.toLowerCase()}`);
    }

    if (filters) {
      if (filters.product_id) params = params.set('productId', filters.product_id);
      if (filters.product_sku) params = params.set('productSku', filters.product_sku);
      if (filters.product_name) params = params.set('productName', filters.product_name);
      if (filters.warehouse_id) params = params.set('warehouseId', filters.warehouse_id);
      if (filters.location_id) params = params.set('locationId', filters.location_id);
      if (filters.batch_id) params = params.set('batchId', filters.batch_id);
      if (filters.batch_number) params = params.set('batchNumber', filters.batch_number);
    }

    return this.http.get<ApiResponse<PageResponse<InventoryResponse>>>(this.apiUrl, { params });
  }

  getSummaryByProduct(productId: string): Observable<ApiResponse<InventorySummaryResponse>> {
    return this.http.get<ApiResponse<InventorySummaryResponse>>(`${this.apiUrl}/summary/${productId}`);
  }

  getByLocation(filters?: InventoryFilterRequest): Observable<ApiResponse<InventoryByLocationResponse[]>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.product_id) params = params.set('productId', filters.product_id);
      if (filters.product_sku) params = params.set('productSku', filters.product_sku);
      if (filters.product_name) params = params.set('productName', filters.product_name);
      if (filters.warehouse_id) params = params.set('warehouseId', filters.warehouse_id);
      if (filters.location_id) params = params.set('locationId', filters.location_id);
      if (filters.batch_id) params = params.set('batchId', filters.batch_id);
      if (filters.batch_number) params = params.set('batchNumber', filters.batch_number);
    }

    return this.http.get<ApiResponse<InventoryByLocationResponse[]>>(`${this.apiUrl}/by-location`, { params });
  }

  /**
   * GET /api/v1/inventories/by-product
   * Aggregate stock per (warehouse, product). Only products with inventory records.
   */
  getStockByProduct(filters?: InventoryFilterRequest): Observable<ApiResponse<InventoryByProductResponse[]>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.product_id) params = params.set('productId', filters.product_id);
      if (filters.product_sku) params = params.set('productSku', filters.product_sku);
      if (filters.product_name) params = params.set('productName', filters.product_name);
      if (filters.warehouse_id) params = params.set('warehouseId', filters.warehouse_id);
      if (filters.batch_id) params = params.set('batchId', filters.batch_id);
    }

    return this.http.get<ApiResponse<InventoryByProductResponse[]>>(`${this.apiUrl}/by-product`, { params });
  }

  checkAvailability(request: CheckInventoryAvailabilityRequest): Observable<ApiResponse<CheckInventoryAvailabilityResponse>> {
    return this.http.post<ApiResponse<CheckInventoryAvailabilityResponse>>(
      `${this.apiUrl}/check-availability`,
      request
    );
  }
}
