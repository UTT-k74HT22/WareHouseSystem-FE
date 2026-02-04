import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { LocationResponse } from '../../dto/response/Location/LocationResponse';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { CreateLocationRequest } from '../../dto/request/Location/CreateLocationRequest';
import { UpdateLocationRequest } from '../../dto/request/Location/UpdateLocationRequest';
import { ChangeLocationStatusRequest } from '../../dto/request/Location/ChangeLocationStatusRequest';
import { SearchLocationRequest } from '../../dto/request/Location/SearchLocationRequest';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly apiUrl = `${BaseURL.API_URL}locations`;

  constructor(private http: HttpClient) {}

  /**
   * Get all locations with pagination
   */
  getAll(page: number = 0, size: number = 10): Observable<ApiResponse<PageResponse<LocationResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

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
   * Search locations with filters
   */
  search(request: SearchLocationRequest, page: number = 0, size: number = 10): Observable<ApiResponse<PageResponse<LocationResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (request.warehouse_id) {
      params = params.set('warehouseId', request.warehouse_id);
    }
    if (request.code) {
      params = params.set('code', request.code);
    }
    if (request.name) {
      params = params.set('name', request.name);
    }
    if (request.zone) {
      params = params.set('zone', request.zone);
    }
    if (request.type) {
      params = params.set('type', request.type);
    }
    if (request.status) {
      params = params.set('status', request.status);
    }

    return this.http.get<ApiResponse<PageResponse<LocationResponse>>>(
      `${this.apiUrl}/search`,
      { params }
    );
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
  changeStatus(id: string, request: ChangeLocationStatusRequest): Observable<ApiResponse<LocationResponse>> {
    return this.http.patch<ApiResponse<LocationResponse>>(`${this.apiUrl}/${id}/status`, request);
  }

  /**
   * Delete a location (soft delete)
   */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
