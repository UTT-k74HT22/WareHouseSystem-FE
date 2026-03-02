import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { UnitsOfMeasureResponse } from '../../dto/response/UOM/UnitsOfMeasureResponse';
import { CreateUOMRequest } from '../../dto/request/UOM/CreateUOMRequest';
import { UpdateUOMRequest } from '../../dto/request/UOM/UpdateUOMRequest';

@Injectable({ providedIn: 'root' })
export class UOMService {
  private readonly apiUrl = `${BaseURL.API_URL}units-of-measure`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/units-of-measure */
  getAll(): Observable<ApiResponse<UnitsOfMeasureResponse[]>> {
    return this.http.get<ApiResponse<UnitsOfMeasureResponse[]>>(this.apiUrl);
  }

  /** GET /api/v1/units-of-measure/:id */
  getById(id: string): Observable<ApiResponse<UnitsOfMeasureResponse>> {
    return this.http.get<ApiResponse<UnitsOfMeasureResponse>>(`${this.apiUrl}/${id}`);
  }

  /** POST /api/v1/units-of-measure */
  create(request: CreateUOMRequest): Observable<ApiResponse<UnitsOfMeasureResponse>> {
    return this.http.post<ApiResponse<UnitsOfMeasureResponse>>(this.apiUrl, request);
  }

  /** PUT /api/v1/units-of-measure/:id */
  update(id: string, request: UpdateUOMRequest): Observable<ApiResponse<UnitsOfMeasureResponse>> {
    return this.http.put<ApiResponse<UnitsOfMeasureResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /** DELETE /api/v1/units-of-measure/:id */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
