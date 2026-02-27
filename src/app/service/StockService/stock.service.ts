import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { StockMovementResponse } from '../../dto/response/Stock/StockMovementResponse';
import { StockAdjustmentResponse } from '../../dto/response/Stock/StockAdjustmentResponse';
import { StockTransferResponse } from '../../dto/response/Stock/StockTransferResponse';
import { CreateStockAdjustmentRequest } from '../../dto/request/Stock/CreateStockAdjustmentRequest';
import { CreateStockTransferRequest } from '../../dto/request/Stock/CreateStockTransferRequest';

@Injectable({ providedIn: 'root' })
export class StockMovementService {
  private readonly movementsUrl = `${BaseURL.API_URL}stock-movements`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/stock-movements */
  getAll(page = 0, size = 10): Observable<ApiResponse<PageResponse<StockMovementResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<StockMovementResponse>>>(this.movementsUrl, { params });
  }

  /** GET /api/v1/stock-movements/:id */
  getById(id: string): Observable<ApiResponse<StockMovementResponse>> {
    return this.http.get<ApiResponse<StockMovementResponse>>(`${this.movementsUrl}/${id}`);
  }

  /** GET /api/v1/stock-movements/product/:productId */
  getByProduct(productId: string, page = 0, size = 10): Observable<ApiResponse<PageResponse<StockMovementResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<StockMovementResponse>>>(
      `${this.movementsUrl}/product/${productId}`, { params }
    );
  }
}

@Injectable({ providedIn: 'root' })
export class StockAdjustmentService {
  private readonly adjustmentsUrl = `${BaseURL.API_URL}stock-adjustments`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/stock-adjustments */
  getAll(page = 0, size = 10): Observable<ApiResponse<PageResponse<StockAdjustmentResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<StockAdjustmentResponse>>>(this.adjustmentsUrl, { params });
  }

  /** GET /api/v1/stock-adjustments/:id */
  getById(id: string): Observable<ApiResponse<StockAdjustmentResponse>> {
    return this.http.get<ApiResponse<StockAdjustmentResponse>>(`${this.adjustmentsUrl}/${id}`);
  }

  /** POST /api/v1/stock-adjustments */
  create(request: CreateStockAdjustmentRequest): Observable<ApiResponse<StockAdjustmentResponse>> {
    return this.http.post<ApiResponse<StockAdjustmentResponse>>(this.adjustmentsUrl, request);
  }
}

@Injectable({ providedIn: 'root' })
export class StockTransferService {
  private readonly transfersUrl = `${BaseURL.API_URL}stock-transfers`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/stock-transfers */
  getAll(page = 0, size = 10): Observable<ApiResponse<PageResponse<StockTransferResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<StockTransferResponse>>>(this.transfersUrl, { params });
  }

  /** GET /api/v1/stock-transfers/:id */
  getById(id: string): Observable<ApiResponse<StockTransferResponse>> {
    return this.http.get<ApiResponse<StockTransferResponse>>(`${this.transfersUrl}/${id}`);
  }

  /** POST /api/v1/stock-transfers */
  create(request: CreateStockTransferRequest): Observable<ApiResponse<StockTransferResponse>> {
    return this.http.post<ApiResponse<StockTransferResponse>>(this.transfersUrl, request);
  }
}
