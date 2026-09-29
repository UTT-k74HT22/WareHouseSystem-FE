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
import { ApproveStockAdjustmentRequest } from '../../dto/request/Stock/ApproveStockAdjustmentRequest';
import { RejectStockAdjustmentRequest } from '../../dto/request/Stock/RejectStockAdjustmentRequest';
import { StockAdjustmentsStatus } from '../../helper/enums/StockAdjustmentsStatus';
import { ReferenceType } from '../../helper/enums/ReferenceType';

// ======================== STOCK MOVEMENTS ========================

@Injectable({ providedIn: 'root' })
export class StockMovementService {
  private readonly movementsUrl = `${BaseURL.API_URL}stock-movements`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/stock-movements */
  getAll(page = 0, size = 20): Observable<ApiResponse<PageResponse<StockMovementResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<StockMovementResponse>>>(this.movementsUrl, { params });
  }

  /** GET /api/v1/stock-movements/:id */
  getById(id: string): Observable<ApiResponse<StockMovementResponse>> {
    return this.http.get<ApiResponse<StockMovementResponse>>(`${this.movementsUrl}/${id}`);
  }

  /** GET /api/v1/stock-movements/reference/:referenceType/:referenceId */
  getByReference(referenceType: ReferenceType, referenceId: string, page = 0, size = 20): Observable<ApiResponse<PageResponse<StockMovementResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<StockMovementResponse>>>(
      `${this.movementsUrl}/reference/${referenceType}/${referenceId}`, { params }
    );
  }
}

// ======================== STOCK ADJUSTMENTS ========================

export interface SearchStockAdjustmentsParams {
  status?: StockAdjustmentsStatus;
  productId?: string;
  warehouseId?: string;
  inventoryId?: string;
  adjustmentNumber?: string;
  createdFrom?: string;
  createdTo?: string;
}

@Injectable({ providedIn: 'root' })
export class StockAdjustmentService {
  private readonly adjustmentsUrl = `${BaseURL.API_URL}stock-adjustments`;

  constructor(private http: HttpClient) {}

  /** GET /api/v1/stock-adjustments (with optional filters) */
  getAll(page = 0, size = 10, filters?: SearchStockAdjustmentsParams): Observable<ApiResponse<PageResponse<StockAdjustmentResponse>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.productId) params = params.set('productId', filters.productId);
      if (filters.warehouseId) params = params.set('warehouseId', filters.warehouseId);
      if (filters.inventoryId) params = params.set('inventoryId', filters.inventoryId);
      if (filters.adjustmentNumber) params = params.set('adjustmentNumber', filters.adjustmentNumber);
      if (filters.createdFrom) params = params.set('createdFrom', filters.createdFrom);
      if (filters.createdTo) params = params.set('createdTo', filters.createdTo);
    }
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

  /** PUT /api/v1/stock-adjustments/:id/approve */
  approve(id: string, request: ApproveStockAdjustmentRequest): Observable<ApiResponse<StockAdjustmentResponse>> {
    return this.http.put<ApiResponse<StockAdjustmentResponse>>(`${this.adjustmentsUrl}/${id}/approve`, request);
  }

  /** PUT /api/v1/stock-adjustments/:id/reject */
  reject(id: string, request: RejectStockAdjustmentRequest): Observable<ApiResponse<StockAdjustmentResponse>> {
    return this.http.put<ApiResponse<StockAdjustmentResponse>>(`${this.adjustmentsUrl}/${id}/reject`, request);
  }
}

// ======================== STOCK TRANSFERS ========================

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

  /** PUT /api/v1/stock-transfers/:id/submit */
  submit(id: string): Observable<ApiResponse<StockTransferResponse>> {
    return this.http.put<ApiResponse<StockTransferResponse>>(`${this.transfersUrl}/${id}/submit`, {});
  }

  /** PUT /api/v1/stock-transfers/:id/complete */
  complete(id: string): Observable<ApiResponse<StockTransferResponse>> {
    return this.http.put<ApiResponse<StockTransferResponse>>(`${this.transfersUrl}/${id}/complete`, {});
  }

  /** PUT /api/v1/stock-transfers/:id/cancel */
  cancel(id: string): Observable<ApiResponse<StockTransferResponse>> {
    return this.http.put<ApiResponse<StockTransferResponse>>(`${this.transfersUrl}/${id}/cancel`, {});
  }
}
