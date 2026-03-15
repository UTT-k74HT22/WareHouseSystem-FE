import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { BatchService } from '../BatchService/batch.service';
import { BusinessPartnerService } from '../BusinessPartnerService/business-partner.service';
import { LocationService } from '../Location/location.service';
import { ProductService } from '../ProductService/product.service';
import { PurchaseOrderLineService } from '../PurchaseOrderLineService/purchase-order-line.service';
import { PurchaseOrderService } from '../PurchaseOrderService/purchase-order.service';
import { WarehouseService } from '../WarehouseService/warehouse.service';
import { BatchResponse } from '../../dto/response/Batch/BatchResponse';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { LocationResponse } from '../../dto/response/Location/LocationResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { PurchaseOrderResponse } from '../../dto/response/PurchaseOrder/PurchaseOrderResponse';
import { PurchaseOrderLineResponse } from '../../dto/response/PurchaseOrderLine/PurchaseOrderLineResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { BusinessPartnerType } from '../../helper/enums/BusinessPartnerType';
import { OrderStatus } from '../../helper/enums/OrderStatus';
import { ApiResponse } from '../../dto/response/ApiResponse';

export interface InboundBaseReferences {
  suppliers: BusinessPartnerResponse[];
  warehouses: WareHouseResponse[];
}

export interface InboundPurchaseOrderContext {
  purchaseOrder: PurchaseOrderResponse | null;
  purchaseOrderLines: PurchaseOrderLineResponse[];
}

export interface InboundLineReferenceData {
  locations: LocationResponse[];
  batches: BatchResponse[];
}

@Injectable({ providedIn: 'root' })
export class InboundReferenceDataService {
  constructor(
    private businessPartnerService: BusinessPartnerService,
    private warehouseService: WarehouseService,
    private purchaseOrderService: PurchaseOrderService,
    private purchaseOrderLineService: PurchaseOrderLineService,
    private productService: ProductService,
    private locationService: LocationService,
    private batchService: BatchService
  ) {}

  loadBaseReferences(): Observable<InboundBaseReferences> {
    return forkJoin({
      suppliers: this.businessPartnerService.getAll(),
      warehouses: this.warehouseService.getList()
    }).pipe(
      map(({ suppliers, warehouses }) => ({
        suppliers: suppliers.success
          ? suppliers.data.filter((partner) =>
            partner.status === 'ACTIVE'
            && (partner.type === BusinessPartnerType.SUPPLIER || partner.type === BusinessPartnerType.BOTH)
          )
          : [],
        warehouses: warehouses.success ? warehouses.data : []
      }))
    );
  }

  loadProductCatalog(): Observable<ProductResponse[]> {
    return this.fetchAllPages((page, size) => this.productService.getAll(page, size));
  }

  loadAvailablePurchaseOrders(): Observable<PurchaseOrderResponse[]> {
    return forkJoin({
      confirmed: this.purchaseOrderService.getAll(0, 100, {
        status: OrderStatus.CONFIRMED,
        sortBy: 'updatedAt',
        direction: 'DESC'
      }),
      partiallyReceived: this.purchaseOrderService.getAll(0, 100, {
        status: OrderStatus.PARTIALLY_RECEIVED,
        sortBy: 'updatedAt',
        direction: 'DESC'
      })
    }).pipe(
      map(({ confirmed, partiallyReceived }) => {
        const mergedMap = new Map<string, PurchaseOrderResponse>();

        for (const order of confirmed.success ? confirmed.data.content : []) {
          mergedMap.set(order.id, order);
        }

        for (const order of partiallyReceived.success ? partiallyReceived.data.content : []) {
          mergedMap.set(order.id, order);
        }

        return Array.from(mergedMap.values()).sort(
          (left, right) => right.updated_at.localeCompare(left.updated_at)
        );
      })
    );
  }

  loadPurchaseOrderContext(purchaseOrderId: string): Observable<InboundPurchaseOrderContext> {
    return forkJoin({
      purchaseOrder: this.purchaseOrderService.getById(purchaseOrderId),
      purchaseOrderLines: this.purchaseOrderLineService.getByPurchaseOrderId(purchaseOrderId)
    }).pipe(
      map(({ purchaseOrder, purchaseOrderLines }) => ({
        purchaseOrder: purchaseOrder.success ? purchaseOrder.data : null,
        purchaseOrderLines: purchaseOrderLines.success ? purchaseOrderLines.data : []
      }))
    );
  }

  loadLineReferences(warehouseId: string): Observable<InboundLineReferenceData> {
    return forkJoin({
      locations: this.fetchAllLocationsByWarehouse(warehouseId).pipe(catchError(() => of([]))),
      batches: this.fetchAllBatches().pipe(catchError(() => of([])))
    });
  }

  private fetchAllBatches(): Observable<BatchResponse[]> {
    return this.fetchAllPages((page, size) => this.batchService.getAll(page, size));
  }

  private fetchAllLocationsByWarehouse(warehouseId: string): Observable<LocationResponse[]> {
    return this.fetchAllPages((page, size) => this.locationService.getByWarehouse(warehouseId, page, size));
  }

  private fetchAllPages<T>(
    loadPage: (page: number, size: number) => Observable<ApiResponse<PageResponse<T>>>
  ): Observable<T[]> {
    const pageSize = 100;

    return loadPage(0, pageSize).pipe(
      switchMap((response) => {
        if (!response.success) {
          return of([]);
        }

        const firstPage = response.data.content || [];
        if (response.data.total_pages <= 1) {
          return of(firstPage);
        }

        const remainingRequests = Array.from({ length: response.data.total_pages - 1 }, (_, index) =>
          loadPage(index + 1, pageSize).pipe(
            map((pageResponse) => pageResponse.success ? pageResponse.data.content : []),
            catchError(() => of([]))
          )
        );

        return forkJoin(remainingRequests).pipe(
          map((pages) => firstPage.concat(...pages))
        );
      })
    );
  }
}
