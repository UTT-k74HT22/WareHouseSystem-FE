import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { InventoryResponse } from '../../dto/response/Inventory/InventoryResponse';
import { InventoryFilterRequest } from '../../dto/request/Inventory/InventoryFilterRequest';

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
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);

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
}
