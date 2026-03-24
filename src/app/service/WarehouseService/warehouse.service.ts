import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseURL } from '../../../environments/BaseURL';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { ApiResponse } from "../../dto/response/ApiResponse";
import { PageResponse } from "../../dto/response/PageResponse";
import { CreateWarehouseRequest } from "../../dto/request/WareHouse/CreateWarehouseRequest";
import { UpdateWarehouseRequest } from "../../dto/request/WareHouse/UpdateWarehouseRequest";
import { ChangeStatusRequest } from "../../dto/request/WareHouse/ChangeStatusRequest";

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {

  private readonly apiUrl = `${BaseURL.API_URL}warehouse`;

  constructor(private http: HttpClient) {}

  /**
   * Get all warehouses with pagination
   */
  getAll(page: number = 0, size: number = 10): Observable<ApiResponse<PageResponse<WareHouseResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PageResponse<WareHouseResponse>>>(
      this.apiUrl,
      { params }
    );
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
        this.getAll(0, 200).pipe(
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
  changeStatus(id: string, request: ChangeStatusRequest): Observable<ApiResponse<WareHouseResponse>> {
    return this.http.patch<ApiResponse<WareHouseResponse>>(`${this.apiUrl}/${id}/status`, request);
  }

  /**
   * Delete a warehouse (if backend supports)
   */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
