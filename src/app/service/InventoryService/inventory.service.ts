import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { InventoryResponse } from '../../dto/response/Inventory/InventoryResponse';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly apiUrl = `${BaseURL.API_URL}inventories`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/inventories */
  getAll(page = 0, size = 10): Observable<ApiResponse<PageResponse<InventoryResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<InventoryResponse>>>(this.apiUrl, { params });
  }

  /** GET /api/v1/inventories/:id */
  getById(id: string): Observable<ApiResponse<InventoryResponse>> {
    return this.http.get<ApiResponse<InventoryResponse>>(`${this.apiUrl}/${id}`);
  }

  /** GET /api/v1/inventories/product/:productId */
  getByProduct(productId: string, page = 0, size = 10): Observable<ApiResponse<PageResponse<InventoryResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<InventoryResponse>>>(
      `${this.apiUrl}/product/${productId}`, { params }
    );
  }

  /** GET /api/v1/inventories/location/:locationId */
  getByLocation(locationId: string, page = 0, size = 10): Observable<ApiResponse<PageResponse<InventoryResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<InventoryResponse>>>(
      `${this.apiUrl}/location/${locationId}`, { params }
    );
  }

  /** GET /api/v1/inventories/warehouse/:warehouseId */
  getByWarehouse(warehouseId: string, page = 0, size = 10): Observable<ApiResponse<PageResponse<InventoryResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<InventoryResponse>>>(
      `${this.apiUrl}/warehouse/${warehouseId}`, { params }
    );
  }
}
