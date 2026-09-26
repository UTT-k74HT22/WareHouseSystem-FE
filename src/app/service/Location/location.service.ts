import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { LocationResponse } from '../../dto/response/Location/LocationResponse';
import { LocationStats } from '../../dto/response/Location/LocationStats';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { CreateLocationRequest, UpdateLocationRequest } from '../../dto/request/Location/LocationRequest';
import { SearchLocationRequest } from '../../dto/request/Location/SearchLocationRequest';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly apiUrl = `${BaseURL.API_URL}locations`;

  constructor(private http: HttpClient) {}

  /**
   * Get locations with pagination and optional filters.
   * No filter = all locations; with filter = filtered search.
   */
  getAll(page: number = 0, size: number = 10, filter: SearchLocationRequest = {}): Observable<ApiResponse<PageResponse<LocationResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filter.warehouse_id) {
      params = params.set('warehouseId', filter.warehouse_id);
    }
    if (filter.code) {
      params = params.set('code', filter.code);
    }
    if (filter.name) {
      params = params.set('name', filter.name);
    }
    if (filter.zone) {
      params = params.set('zone', filter.zone);
    }
    if (filter.keyword?.trim()) {
      params = params.set('keyword', filter.keyword.trim());
    }
    if (filter.type) {
      params = params.set('type', filter.type);
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }

    return this.http.get<ApiResponse<PageResponse<LocationResponse>>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get location by ID
   */
  getById(id: string): Observable<ApiResponse<LocationResponse>> {
    return this.http.get<ApiResponse<LocationResponse>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get locations by warehouse ID with pagination
   */
  getByWarehouse(warehouseId: string, page: number = 0, size: number = 10): Observable<ApiResponse<PageResponse<LocationResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PageResponse<LocationResponse>>>(
      `${this.apiUrl}/warehouse/${warehouseId}`,
      { params }
    );
  }

  /**
   * Get location statistics by status (global counts).
   */
  getStats(): Observable<ApiResponse<LocationStats>> {
    return this.http.get<ApiResponse<LocationStats>>(`${this.apiUrl}/stats`);
  }

  /**
   * Create a new location
   */
  create(request: CreateLocationRequest): Observable<ApiResponse<LocationResponse>> {
    return this.http.post<ApiResponse<LocationResponse>>(this.apiUrl, request);
  }

  /**
   * Update an existing location
   */
  update(id: string, request: UpdateLocationRequest): Observable<ApiResponse<LocationResponse>> {
    return this.http.put<ApiResponse<LocationResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Change location status
   */
  changeStatus(id: string, request: UpdateLocationRequest): Observable<ApiResponse<LocationResponse>> {
    return this.http.patch<ApiResponse<LocationResponse>>(`${this.apiUrl}/${id}/status`, request);
  }

  /**
   * Delete a location (soft delete)
   */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
