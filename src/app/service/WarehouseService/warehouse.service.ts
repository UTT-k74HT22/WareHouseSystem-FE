import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseURL } from '../../../environments/BaseURL';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { WareHouseStats } from '../../dto/response/WareHouse/WareHouseStats';
import { ApiResponse } from "../../dto/response/ApiResponse";
import { PageResponse } from "../../dto/response/PageResponse";
import { CreateWarehouseRequest, UpdateWarehouseRequest } from "../../dto/request/WareHouse/WarehouseRequest";

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {

  private readonly apiUrl = `${BaseURL.API_URL}warehouse`;

  constructor(private http: HttpClient) {}

  /**
   * Get warehouses with pagination and optional filters.
   * No filter = all warehouses; with keyword/status/type = filtered search.
   */
  getAll(page: number = 0, size: number = 10, keyword = '', status = '', type = ''): Observable<ApiResponse<PageResponse<WareHouseResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (keyword?.trim()) {
      params = params.set('keyword', keyword.trim());
    }
    if (status) {
      params = params.set('status', status);
    }
    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<ApiResponse<PageResponse<WareHouseResponse>>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get warehouse statistics by status (global counts).
   */
  getStats(): Observable<ApiResponse<WareHouseStats>> {
    return this.http.get<ApiResponse<WareHouseStats>>(`${this.apiUrl}/stats`);
  }

  /**
   * Get warehouse by ID
   */
  getById(id: string): Observable<ApiResponse<WareHouseResponse>> {
    return this.http.get<ApiResponse<WareHouseResponse>>(`${this.apiUrl}/${id}`);
  }

  getList(): Observable<ApiResponse<WareHouseResponse[]>> {
    return this.http.get<ApiResponse<WareHouseResponse[]>>(`${this.apiUrl}/all`).pipe(
      catchError(() =>
        this.getAll(0, 100).pipe(
          map((response) => ({
            ...response,
            data: response.data?.content || []
          }))
        )
      )
    );
  }

  /**
   * Create a new warehouse
   */
  create(request: CreateWarehouseRequest): Observable<ApiResponse<WareHouseResponse>> {
    return this.http.post<ApiResponse<WareHouseResponse>>(this.apiUrl, request);
  }

  /**
   * Update an existing warehouse
   */
  update(id: string, request: UpdateWarehouseRequest): Observable<ApiResponse<WareHouseResponse>> {
    return this.http.put<ApiResponse<WareHouseResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Change warehouse status
   */
  changeStatus(id: string, request: UpdateWarehouseRequest): Observable<ApiResponse<WareHouseResponse>> {
    return this.http.patch<ApiResponse<WareHouseResponse>>(`${this.apiUrl}/${id}/status`, request);
  }

  /**
   * Delete a warehouse (soft delete -> INACTIVE, BE returns 204).
   * BE validates active locations (WH_005) and inventory (WH_006).
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
