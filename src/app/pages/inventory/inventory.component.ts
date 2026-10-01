import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, catchError, debounceTime, forkJoin, map, of } from 'rxjs';
import { InventoryResponse } from '../../dto/response/Inventory/InventoryResponse';
import { InventoryService } from '../../service/InventoryService/inventory.service';
import { BatchService } from '../../service/BatchService/batch.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';
import { LocationService } from '../../service/Location/location.service';
import { ProductService } from '../../service/ProductService/product.service';
import { LocationResponse } from '../../dto/response/Location/LocationResponse';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { InventoryFilterRequest } from '../../dto/request/Inventory/InventoryFilterRequest';
import {
  InventoryByLocationResponse,
  LocationInventoryItemResponse
} from '../../dto/response/Inventory/InventoryByLocationResponse';
import { InventoryByProductResponse } from '../../dto/response/Inventory/InventoryByProductResponse';
import { BatchByProductResponse } from '../../dto/response/Batch/BatchByProductResponse';
import { InventorySummaryResponse } from '../../dto/response/Inventory/InventorySummaryResponse';
import { SearchStockMovementsParams, StockMovementService } from '../../service/StockService/stock.service';
import { StockMovementResponse } from '../../dto/response/Stock/StockMovementResponse';
import { StockMovementType } from '../../helper/enums/StockMovementType';
import { ReferenceType } from '../../helper/enums/ReferenceType';

export interface HistoryGroup {
  key: string;
  referenceType: ReferenceType;
  referenceNumber: string;
  latestDate: string;
  netQuantity: number;
  moves: StockMovementResponse[];
}

export interface HistoryDaySection {
  day: string;
  label: string;
  groups: HistoryGroup[];
  inQty: number;
  outQty: number;
  adjustQty: number;
  netQty: number;
}

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit, OnDestroy {
  private readonly filterChange$ = new Subject<void>();
  private filterSubscription?: Subscription;

  locationGroups: InventoryByLocationResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  locations: LocationResponse[] = [];
  products: ProductResponse[] = [];

  loading = false;
  detailLoading = false;
  inventoryTab: 'products' | 'locations' = 'products';

  searchProductName = '';
  searchProductSku = '';
  searchBatchNumber = '';
  selectedWarehouseId = '';
  selectedLocationId = '';
  productStocks: InventoryByProductResponse[] = [];
  /** Mã lô theo (kho, sản phẩm), lấy từ module lô hàng (BatchService.getByProduct). */
  productBatchMap = new Map<string, string[]>();
  private readonly productBatchCache = new Map<string, BatchByProductResponse[]>();

  showDetailModal = false;
  selectedItem: InventoryResponse | null = null;
  selectedSummary: InventorySummaryResponse | null = null;
  selectedDistribution: InventoryByLocationResponse[] = [];

  showHistoryModal = false;
  historyItem: InventoryByProductResponse | null = null;
  historyMovements: StockMovementResponse[] = [];
  historyLoading = false;
  historyPage = 0;
  historyPageSize = 50;
  historyTotalElements = 0;
  historyTotalPages = 0;
  historyDateFrom = '';
  historyDateTo = '';
  historyBatches: { id: string; batch_number: string }[] = [];
  historyDistribution: InventoryByLocationResponse[] = [];
  historyTypeFilter: 'ALL' | 'IN' | 'OUT' | 'MOVE' | 'ADJUST' = 'ALL';
  expandedHistoryGroups = new Set<string>();

  constructor(
    private inventoryService: InventoryService,
    private batchService: BatchService,
    private warehouseService: WarehouseService,
    private locationService: LocationService,
    private productService: ProductService,
    private stockMovementService: StockMovementService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.filterSubscription = this.filterChange$
      .pipe(debounceTime(400))
      .subscribe(() => {
        this.loadInventory(true);
      });
    this.loadLookupData();
    this.loadInventory();
  }

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
  }

  get availableLocations(): LocationResponse[] {
    if (!this.selectedWarehouseId) {
      return this.locations;
    }

    return this.locations.filter((location) => location.warehouse_id === this.selectedWarehouseId);
  }

  get totalQuantityOnHand(): number {
    return this.sumLocationGroups((item) => item.on_hand_quantity);
  }

  get totalQuantityReserved(): number {
    return this.sumLocationGroups((item) => item.reserved_quantity);
  }

  get totalQuantityAvailable(): number {
    return this.sumLocationGroups((item) => item.available_quantity);
  }

  get totalLocationGroups(): number {
    return this.locationGroups.length;
  }

  loadLookupData(): void {
    forkJoin({
      warehouses: this.warehouseService.getList().pipe(
        map((response) => response.data),
        catchError(() => of([] as WareHouseResponse[]))
      ),
      locations: this.locationService.getFullList().pipe(
        catchError(() => of([] as LocationResponse[]))
      ),
      products: this.productService.getFullList().pipe(
        catchError(() => of([] as ProductResponse[]))
      )
    }).subscribe((result) => {
      this.warehouses = result.warehouses;
      this.locations = result.locations;
      this.products = result.products;
      this.selectedItem = this.selectedItem ? this.enrichInventory(this.selectedItem) : null;
    });
  }

  private loadSeq = 0;

  loadInventory(silent = false): void {
    if (!silent) {
      this.loading = true;
    }
    const seq = ++this.loadSeq;
    const filters = this.buildFilters();

    forkJoin({
      byLocation: this.inventoryService.getByLocation(filters).pipe(
        map((response) => response.success ? response.data : []),
        catchError(() => of([] as InventoryByLocationResponse[]))
      ),
      byProduct: this.inventoryService.getStockByProduct(filters).pipe(
        map((response) => response.success ? response.data : []),
        catchError(() => of([] as InventoryByProductResponse[]))
      )
    }).subscribe({
      next: ({ byLocation, byProduct }) => {
        if (seq !== this.loadSeq) {
          return;
        }
        this.locationGroups = this.sortLocationGroups(byLocation);
        this.productStocks = [...byProduct].sort((a, b) =>
          `${a.product_name || ''}`.localeCompare(`${b.product_name || ''}`));
        this.loadProductBatches(seq, this.productStocks);
        this.loading = false;
      },
      error: (error) => {
        if (seq !== this.loadSeq) {
          return;
        }
        this.locationGroups = [];
        this.productStocks = [];
        this.productBatchMap = new Map<string, string[]>();
        this.toastr.error('Tồn kho', error?.error?.message || 'Không tải được dữ liệu tồn kho.');
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.loadInventory(true);
  }

  onResetFilter(): void {
    this.searchProductName = '';
    this.searchProductSku = '';
    this.searchBatchNumber = '';
    this.selectedWarehouseId = '';
    this.selectedLocationId = '';
    this.loadInventory(true);
  }

  onTextFilterChange(): void {
    this.filterChange$.next();
  }

  onWarehouseChange(warehouseId: string): void {
    this.selectedWarehouseId = warehouseId;

    if (this.selectedLocationId) {
      const locationStillValid = this.availableLocations.some((location) => location.id === this.selectedLocationId);
      if (!locationStillValid) {
        this.selectedLocationId = '';
      }
    }

    this.loadInventory(true);
  }

  onLocationChange(locationId: string): void {
    this.selectedLocationId = locationId;
    this.loadInventory(true);
  }

  openDetailModal(item: InventoryResponse): void {
    this.selectedItem = this.enrichInventory(item);
    this.selectedSummary = null;
    this.selectedDistribution = [];
    this.showDetailModal = true;
    this.loadDetailContext(this.selectedItem);
  }

  openProductDetail(stock: InventoryByProductResponse): void {
    const synthetic = {
      product_id: stock.product_id,
      product_name: stock.product_name,
      product_sku: stock.product_sku,
      warehouse_id: stock.warehouse_id,
      warehouse_name: stock.warehouse_name,
      on_hand_quantity: stock.total_on_hand_quantity,
      reserved_quantity: stock.total_reserved_quantity,
      available_quantity: stock.total_available_quantity
    } as unknown as InventoryResponse;
    this.openDetailModal(synthetic);
  }

  closeAllModals(): void {
    this.showDetailModal = false;
    this.selectedItem = null;
    this.selectedSummary = null;
    this.selectedDistribution = [];
    this.detailLoading = false;
  }

  getStockStateLabel(item: InventoryResponse): string {
    if (item.available_quantity <= 0) {
      return 'Hết khả dụng';
    }
    if (item.available_quantity < 10) {
      return 'Khả dụng thấp';
    }
    return 'Ổn định';
  }

  getStockStateClass(item: InventoryResponse): string {
    if (item.available_quantity <= 0) {
      return 'inventory-badge-empty';
    }
    if (item.available_quantity < 10) {
      return 'inventory-badge-low';
    }
    return 'inventory-badge-ok';
  }

  /** Mã lô của một dòng tồn theo sản phẩm (từ module lô hàng, ưu tiên đúng kho của dòng). */
  getProductBatches(stock: InventoryByProductResponse): string[] {
    return this.productBatchMap.get(`${stock.warehouse_id}__${stock.product_id}`)
      || this.productBatchMap.get(`__${stock.product_id}`)
      || [];
  }

  getProductBatchLabel(stock: InventoryByProductResponse): string {
    const codes = this.getProductBatches(stock);
    if (codes.length === 0) {
      return '—';
    }
    const shown = codes.slice(0, 3).join(', ');
    return codes.length > 3 ? `${shown} (+${codes.length - 3})` : shown;
  }

  /** Trạng thái tồn theo sản phẩm, tái dùng thang của dòng bản ghi (hết / thấp / ổn định). */
  getProductStateLabel(stock: InventoryByProductResponse): string {
    return this.getStockStateLabel({ available_quantity: stock.total_available_quantity } as InventoryResponse);
  }

  getProductStateClass(stock: InventoryByProductResponse): string {
    return this.getStockStateClass({ available_quantity: stock.total_available_quantity } as InventoryResponse);
  }

  /** Tải lô theo từng sản phẩm (có cache theo kho đang lọc để khỏi gọi lặp). */
  private loadProductBatches(seq: number, stocks: InventoryByProductResponse[]): void {
    const warehouseFilter = this.selectedWarehouseId || '';
    const ids = [...new Set(stocks.map((stock) => stock.product_id))];
    const missing = ids.filter((id) => !this.productBatchCache.has(`${warehouseFilter}__${id}`));
    if (missing.length === 0) {
      this.productBatchMap = this.buildProductBatchMap(ids, warehouseFilter);
      return;
    }
    forkJoin(
      missing.map((id) =>
        this.batchService.getByProduct(id, this.selectedWarehouseId || undefined).pipe(
          map((response) => response.success ? response.data : [] as BatchByProductResponse[]),
          catchError(() => of([] as BatchByProductResponse[]))
        )
      )
    ).subscribe((lists) => {
      if (seq !== this.loadSeq) {
        return;
      }
      missing.forEach((id, index) => {
        this.productBatchCache.set(`${warehouseFilter}__${id}`, lists[index] || []);
      });
      this.productBatchMap = this.buildProductBatchMap(ids, warehouseFilter);
    });
  }

  private buildProductBatchMap(productIds: string[], warehouseFilter: string): Map<string, string[]> {
    const collected = new Map<string, Set<string>>();
    const addCode = (key: string, code: string) => {
      let codes = collected.get(key);
      if (!codes) {
        codes = new Set<string>();
        collected.set(key, codes);
      }
      codes.add(code);
    };
    for (const id of productIds) {
      const batches = this.productBatchCache.get(`${warehouseFilter}__${id}`) || [];
      for (const batch of batches) {
        const code = (batch.batch_number || '').trim();
        if (!code) {
          continue;
        }
        addCode(`__${id}`, code);
        for (const warehouse of batch.inventory_snapshot?.warehouses || []) {
          if (warehouse.warehouse_id) {
            addCode(`${warehouse.warehouse_id}__${id}`, code);
          }
        }
      }
    }
    return new Map([...collected.entries()].map(([key, codes]) => [key, [...codes].sort((a, b) => a.localeCompare(b))]));
  }

  getLocationGroupLabel(group: InventoryByLocationResponse): string {
    const code = group.location_code?.trim();
    const name = group.location_name?.trim();

    if (code && name) {
      return `${code} - ${name}`;
    }
    if (name) {
      return name === 'Unassigned' ? 'Chưa gán vị trí' : name;
    }
    if (code) {
      return code;
    }
    return 'Chưa gán vị trí';
  }

  getWarehouseLabel(group: InventoryByLocationResponse): string {
    return group.warehouse_name || 'Kho không xác định';
  }

  getGroupOnHand(group: InventoryByLocationResponse): number {
    return group.items.reduce((sum, item) => sum + Number(item.on_hand_quantity), 0);
  }

  getGroupReserved(group: InventoryByLocationResponse): number {
    return group.items.reduce((sum, item) => sum + Number(item.reserved_quantity), 0);
  }

  getGroupAvailable(group: InventoryByLocationResponse): number {
    return group.items.reduce((sum, item) => sum + Number(item.available_quantity), 0);
  }

  getDetailDistributionTitle(): string {
    if (this.selectedItem?.batch_id) {
      return 'Phân bổ tồn của lô theo vị trí';
    }
    return 'Phân bổ tồn của sản phẩm theo vị trí';
  }

  getSummaryAvailableQuantity(): number {
    if (!this.selectedSummary) {
      return 0;
    }

    const explicitAvailable = this.selectedSummary.total_available_quantity;
    if (explicitAvailable !== undefined && explicitAvailable !== null) {
      return Number(explicitAvailable);
    }

    return Number(this.selectedSummary.total_on_hand_quantity) - Number(this.selectedSummary.total_reserved_quantity);
  }

  private loadDetailContext(item: InventoryResponse): void {
    this.detailLoading = true;

    forkJoin({
      summary: this.inventoryService.getSummaryByProduct(item.product_id).pipe(
        map((response) => response.success ? response.data : null),
        catchError(() => of(null))
      ),
      distribution: this.inventoryService.getByLocation({
        product_id: item.product_id,
        batch_id: item.batch_id || undefined
      }).pipe(
        map((response) => response.success ? response.data : []),
        catchError(() => of([] as InventoryByLocationResponse[]))
      )
    }).subscribe(({ summary, distribution }) => {
      this.selectedSummary = summary;
      this.selectedDistribution = this.sortLocationGroups(distribution);
      this.detailLoading = false;
    });
  }

  private enrichInventory(item: InventoryResponse): InventoryResponse {
    const location = this.locations.find((entry) => entry.id === item.location_id);
    const product = this.products.find((entry) => entry.id === item.product_id);

    return {
      ...item,
      location_name: location?.name || item.location_name,
      uom_code: product?.uom_code || item.uom_code
    };
  }

  private buildFilters(): InventoryFilterRequest {
    return {
      product_name: this.searchProductName.trim() || undefined,
      product_sku: this.searchProductSku.trim() || undefined,
      batch_number: this.searchBatchNumber.trim() || undefined,
      warehouse_id: this.selectedWarehouseId || undefined,
      location_id: this.selectedLocationId || undefined
    };
  }

  // ======================== HISTORY (traceability) ========================

  openHistoryModal(stock: InventoryByProductResponse): void {
    this.historyItem = stock;
    this.historyPage = 0;
    this.historyDateFrom = '';
    this.historyDateTo = '';
    this.historyTypeFilter = 'ALL';
    this.expandedHistoryGroups = new Set<string>();
    this.historyBatches = [];
    this.historyDistribution = [];
    this.historyMovements = [];
    this.showHistoryModal = true;
    this.loadHistoryDistribution();
    this.loadHistoryMovements();
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.historyItem = null;
    this.historyMovements = [];
    this.historyDistribution = [];
    this.historyBatches = [];
    this.historyLoading = false;
    this.expandedHistoryGroups = new Set<string>();
  }

  onHistoryDateChange(): void {
    this.historyPage = 0;
    this.loadHistoryMovements();
  }

  onHistoryPageChange(page: number): void {
    if (page < 0 || page >= this.historyTotalPages) {
      return;
    }
    this.historyPage = page;
    this.loadHistoryMovements();
  }

  private loadHistoryDistribution(): void {
    if (!this.historyItem) {
      return;
    }
    this.inventoryService.getByLocation({
      product_id: this.historyItem.product_id,
      warehouse_id: this.historyItem.warehouse_id
    }).pipe(
      map((response) => response.success ? response.data : []),
      catchError(() => of([] as InventoryByLocationResponse[]))
    ).subscribe((groups) => {
      this.historyDistribution = this.sortLocationGroups(groups);
      const batchMap = new Map<string, string>();
      for (const group of this.historyDistribution) {
        for (const item of group.items || []) {
          if (item.batch_id && !batchMap.has(item.batch_id)) {
            batchMap.set(item.batch_id, item.batch_number || item.batch_id);
          }
        }
      }
      this.historyBatches = [...batchMap.entries()].map(([id, batch_number]) => ({ id, batch_number }));
    });
  }

  private loadHistoryMovements(): void {
    if (!this.historyItem) {
      return;
    }
    this.historyLoading = true;
    const filters: SearchStockMovementsParams = {
      product_id: this.historyItem.product_id,
      warehouse_id: this.historyItem.warehouse_id,
      movement_date_from: this.historyDateFrom || undefined,
      movement_date_to: this.historyDateTo || undefined
    };
    this.stockMovementService.getAll(this.historyPage, this.historyPageSize, filters).subscribe({
      next: (res) => {
        if (res.success) {
          this.historyMovements = res.data.content;
          this.historyTotalElements = res.data.total_elements;
          this.historyTotalPages = res.data.total_pages;
          const groups = this.getHistoryGroups();
          this.expandedHistoryGroups = new Set(groups.slice(0, 1).map((group) => group.key));
        }
        this.historyLoading = false;
      },
      error: (error) => {
        this.historyMovements = [];
        this.historyLoading = false;
        this.toastr.error('Tồn kho', error?.error?.message || 'Không tải được lịch sử tồn kho.');
      }
    });
  }

  getHistoryLocationShort(locationId: string | null): string {
    if (!locationId) {
      return '—';
    }
    const location = this.locations.find((entry) => entry.id === locationId);
    return location ? location.name : locationId.slice(0, 8);
  }

  getMovementCategory(type: StockMovementType): 'IN' | 'OUT' | 'MOVE' | 'ADJUST' | 'TECH' {
    switch (type) {
      case StockMovementType.INBOUND: return 'IN';
      case StockMovementType.OUTBOUND: return 'OUT';
      case StockMovementType.INTERNAL_MOVE:
      case StockMovementType.TRANSFER_IN:
      case StockMovementType.TRANSFER_OUT: return 'MOVE';
      case StockMovementType.ADJUSTMENT_INCREASE:
      case StockMovementType.ADJUSTMENT_DECREASE: return 'ADJUST';
      default: return 'TECH';
    }
  }

  getVisibleHistoryMovements(): StockMovementResponse[] {
    return this.historyMovements.filter((movement) => {
      const category = this.getMovementCategory(movement.movement_type);
      if (this.historyTypeFilter !== 'ALL' && category !== this.historyTypeFilter) {
        return false;
      }
      return true;
    });
  }

  getHistoryGroups(): HistoryGroup[] {
    const groups = new Map<string, HistoryGroup>();
    for (const movement of this.getVisibleHistoryMovements()) {
      const key = `${movement.reference_type}__${movement.reference_id || movement.reference_number || movement.id}`;
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          referenceType: movement.reference_type,
          referenceNumber: movement.reference_number || movement.reference_id.slice(0, 8),
          latestDate: movement.movement_date,
          netQuantity: 0,
          moves: []
        };
        groups.set(key, group);
      }
      group.moves.push(movement);
      group.netQuantity += Number(movement.quantity_change);
      if (movement.movement_date > group.latestDate) {
        group.latestDate = movement.movement_date;
      }
    }
    return [...groups.values()].sort((a, b) => (b.latestDate || '').localeCompare(a.latestDate || ''));
  }

  /** Gom các nhóm chứng từ theo ngày (mới nhất trước) kèm tổng nhập/xuất/ròng từng ngày. */
  getHistoryDaySections(): HistoryDaySection[] {
    const byDay = new Map<string, HistoryGroup[]>();
    for (const group of this.getHistoryGroups()) {
      const day = (group.latestDate || '').slice(0, 10) || 'unknown';
      const list = byDay.get(day);
      if (list) {
        list.push(group);
      } else {
        byDay.set(day, [group]);
      }
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([day, groups]) => {
        let inQty = 0;
        let outQty = 0;
        let adjustQty = 0;
        for (const group of groups) {
          for (const movement of group.moves) {
            const qty = Number(movement.quantity_change);
            switch (this.getMovementCategory(movement.movement_type)) {
              case 'IN': inQty += qty; break;
              case 'OUT': outQty += Math.abs(qty); break;
              case 'ADJUST': adjustQty += qty; break;
              default: break;
            }
          }
        }
        return {
          day,
          label: this.formatDayLabel(day),
          groups,
          inQty,
          outQty,
          adjustQty,
          netQty: inQty - outQty + adjustQty
        };
      });
  }

  private formatDayLabel(day: string): string {
    if (day === 'unknown') {
      return 'Không rõ ngày';
    }
    const parsed = new Date(`${day}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return day;
    }
    return parsed.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  isHistoryGroupExpanded(key: string): boolean {
    return this.expandedHistoryGroups.has(key);
  }

  toggleHistoryGroup(key: string): void {
    if (this.expandedHistoryGroups.has(key)) {
      this.expandedHistoryGroups.delete(key);
    } else {
      this.expandedHistoryGroups.add(key);
    }
  }

  hasBusinessRef(group: HistoryGroup): boolean {
    return group.moves.some((m) => !!m.reference_number);
  }

  getHistoryGroupTitle(group: HistoryGroup): string {
    const doc = this.getReferenceTypeLabel(group.referenceType);
    const qty = group.netQuantity;
    const absQty = Math.abs(qty);
    const legs = this.getPairedLegs(group);
    const firstOut = group.moves.find((m) =>
      m.movement_type === StockMovementType.OUTBOUND
      || (m.movement_type === StockMovementType.INTERNAL_MOVE && Number(m.quantity_change) < 0));
    if (qty < 0 && firstOut) {
      return `Xuất ${absQty} từ ${this.getHistoryLocationShort(firstOut.location_id)} → ra khỏi kho · ${doc}`;
    }
    if (qty > 0) {
      const inbound = group.moves.find((m) => m.movement_type === StockMovementType.INBOUND);
      const where = inbound
        ? ` vào ${this.getHistoryLocationShort(inbound.location_id)}`
        : (firstOut ? ` tại ${this.getHistoryLocationShort(firstOut.location_id)}` : '');
      return `${group.moves.every((m) => Number(m.quantity_change) >= 0) ? 'Nhập' : 'Tăng ròng'} +${qty}${where} · ${doc}`;
    }
    if (group.moves.length === 1) {
      const single = group.moves[0];
      if (single.movement_type === StockMovementType.RESERVE) {
        return `Giữ chỗ ${absQty} cho đơn bán`;
      }
      return `${this.getMovementTypeLabel(single.movement_type)} · ${doc}`;
    }
    if (legs.length > 0 && legs.every((leg) => leg.kind === 'pair')) {
      const legQty = Math.abs(Number(legs[0].movement.quantity_change));
      return `Luân chuyển ${legQty} qua ${legs.length} chặng · ${doc}`;
    }
    return `${doc} · ${legs.length} bước`;
  }

  getPairedLegs(group: HistoryGroup): { kind: 'pair' | 'single'; movement: StockMovementResponse; fromId: string | null; toId: string | null }[] {
    const legs: { kind: 'pair' | 'single'; movement: StockMovementResponse; fromId: string | null; toId: string | null }[] = [];
    const used = new Set<StockMovementResponse>();
    for (const out of group.moves) {
      if (used.has(out)) {
        continue;
      }
      if (out.movement_type === StockMovementType.INTERNAL_MOVE && Number(out.quantity_change) < 0) {
        const peer = group.moves.find((candidate) =>
          !used.has(candidate)
          && candidate !== out
          && candidate.movement_type === StockMovementType.INTERNAL_MOVE
          && Number(candidate.quantity_change) === -Number(out.quantity_change)
          && candidate.movement_date === out.movement_date);
        if (peer) {
          used.add(out);
          used.add(peer);
          legs.push({ kind: 'pair', movement: out, fromId: out.location_id ?? null, toId: out.to_location_id ?? null });
          continue;
        }
      }
      used.add(out);
      legs.push({
        kind: 'single',
        movement: out,
        fromId: out.location_id ?? null,
        toId: out.to_location_id ?? null
      });
    }
    return legs;
  }

  getMoveNote(movement: StockMovementResponse): string | null {
    const note = (movement.notes || '').trim();
    if (!note) {
      return null;
    }
    // Ẩn ghi chú kỹ thuật chứa ID thô, thay bằng diễn giải tiếng Việt ở mô tả bước.
    if (/internal move (in|out)/i.test(note) || /orderline:/i.test(note) || /^[0-9a-f-]{32,}$/i.test(note)) {
      return null;
    }
    return note;
  }

  getLegDescription(leg: { kind: 'pair' | 'single'; movement: StockMovementResponse; fromId: string | null; toId: string | null }): string {
    const movement = leg.movement;
    const qty = Math.abs(Number(movement.quantity_change));
    const from = this.getHistoryLocationShort(leg.fromId);
    if (leg.kind === 'pair') {
      const to = this.getHistoryLocationShort(leg.toId);
      return `${from} → ${to} · ${qty}`;
    }
    switch (movement.movement_type) {
      case StockMovementType.INBOUND:
        return `Nhập +${qty} vào ${from}`;
      case StockMovementType.OUTBOUND:
        return `Xuất −${qty} từ ${from} ra khỏi kho`;
      case StockMovementType.ADJUSTMENT_INCREASE:
      case StockMovementType.ADJUSTMENT_DECREASE:
        return `Điều chỉnh tại ${from}`;
      case StockMovementType.RESERVE:
        return `Giữ chỗ ${qty} cho đơn bán`;
      case StockMovementType.UNRESERVE:
        return `Xả giữ chỗ ${qty}`;
      default:
        return `${this.getMovementTypeLabel(movement.movement_type)} tại ${from}`;
    }
  }

  getAbsQuantity(movement: StockMovementResponse): number {
    return Math.abs(Number(movement.quantity_change));
  }

  isLegNetChange(leg: { kind: 'pair' | 'single'; movement: StockMovementResponse }): boolean {
    // Chỉ tô đỏ/xanh cho bước làm đổi tồn tổng (nhập/xuất/điều chỉnh).
    // Chuyển nội bộ và giữ chỗ luôn hiển thị trung tính.
    if (leg.kind === 'pair') {
      return false;
    }
    return leg.movement.movement_type === StockMovementType.INBOUND
      || leg.movement.movement_type === StockMovementType.OUTBOUND
      || leg.movement.movement_type === StockMovementType.ADJUSTMENT_INCREASE
      || leg.movement.movement_type === StockMovementType.ADJUSTMENT_DECREASE;
  }

  isPhysicalGroup(group: HistoryGroup): boolean {
    // Nhóm làm đổi tồn vật lý: chứa nhập/xuất/điều chỉnh.
    // Nhóm chỉ giữ chỗ/chuyển nội bộ (ròng tồn không đổi) -> trung tính.
    return group.moves.some((m) =>
      m.movement_type === StockMovementType.INBOUND
      || m.movement_type === StockMovementType.OUTBOUND
      || m.movement_type === StockMovementType.ADJUSTMENT_INCREASE
      || m.movement_type === StockMovementType.ADJUSTMENT_DECREASE);
  }

  openReferenceDoc(group: HistoryGroup): void {
    const routeByReference: Record<string, string> = {
      INBOUND_RECEIPT: '/inbound',
      OUTBOUND_SHIPMENT: '/outbound',
      STOCK_ADJUSTMENT: '/stock-adjustments',
      STOCK_TRANSFER: '/stock-transfers',
      SALES_ORDER: '/sales-order',
      PURCHASE_ORDER: '/purchase-order'
    };
    const route = routeByReference[String(group.referenceType)];
    const referenceId = group.moves[0]?.reference_id;
    if (!route || !referenceId) {
      return;
    }
    this.closeHistoryModal();
    this.router.navigate([route], { queryParams: { doc: referenceId } });
  }

  getHistoryBatchLabel(batchId: string | null): string {
    if (!batchId) {
      return '—';
    }
    const batch = this.historyBatches.find((entry) => entry.id === batchId);
    return batch ? batch.batch_number : batchId.slice(0, 8);
  }

  getMovementTypeLabel(type: StockMovementType): string {
    switch (type) {
      case StockMovementType.INBOUND: return 'Nhập kho';
      case StockMovementType.OUTBOUND: return 'Xuất kho';
      case StockMovementType.INTERNAL_MOVE: return 'Chuyển vị trí';
      case StockMovementType.ADJUSTMENT_INCREASE: return 'Điều chỉnh tăng';
      case StockMovementType.ADJUSTMENT_DECREASE: return 'Điều chỉnh giảm';
      case StockMovementType.TRANSFER_IN: return 'Chuyển đến';
      case StockMovementType.TRANSFER_OUT: return 'Chuyển đi';
      case StockMovementType.RESERVE: return 'Giữ chỗ';
      case StockMovementType.UNRESERVE: return 'Xả giữ chỗ';
      default: return type;
    }
  }

  getReferenceTypeLabel(type: ReferenceType): string {
    switch (type) {
      case ReferenceType.INBOUND_RECEIPT: return 'Phiếu nhập';
      case ReferenceType.OUTBOUND_SHIPMENT: return 'Phiếu xuất';
      case ReferenceType.STOCK_ADJUSTMENT: return 'Điều chỉnh';
      case ReferenceType.STOCK_TRANSFER: return 'Chuyển kho';
      default: {
        const raw = String(type);
        if (raw === 'SALES_ORDER') {
          return 'Đơn bán';
        }
        if (raw === 'PURCHASE_ORDER') {
          return 'Đơn mua';
        }
        return raw;
      }
    }
  }

  private sortLocationGroups(groups: InventoryByLocationResponse[]): InventoryByLocationResponse[] {
    return [...groups]
      .map((group) => ({
        ...group,
        items: this.sortLocationItems(group.items || [])
      }))
      .sort((left, right) => {
        const warehouseCompare = this.getWarehouseLabel(left).localeCompare(this.getWarehouseLabel(right));
        if (warehouseCompare !== 0) {
          return warehouseCompare;
        }
        return this.getLocationGroupLabel(left).localeCompare(this.getLocationGroupLabel(right));
      });
  }

  private sortLocationItems(items: LocationInventoryItemResponse[]): LocationInventoryItemResponse[] {
    return [...items].sort((left, right) => {
      const productCompare = `${left.product_name || ''} ${left.product_sku || ''}`
        .localeCompare(`${right.product_name || ''} ${right.product_sku || ''}`);
      if (productCompare !== 0) {
        return productCompare;
      }
      return (left.batch_number || '').localeCompare(right.batch_number || '');
    });
  }

  private sumLocationGroups(selector: (item: LocationInventoryItemResponse) => number): number {
    return this.locationGroups.reduce(
      (sum, group) => sum + group.items.reduce((itemSum, item) => itemSum + Number(selector(item)), 0),
      0
    );
  }
}
