import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, catchError, forkJoin, map, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { ApiResponse } from '../../dto/response/ApiResponse';
import { BatchResponse } from '../../dto/response/Batch/BatchResponse';
import { InventoryResponse } from '../../dto/response/Inventory/InventoryResponse';
import { LocationResponse } from '../../dto/response/Location/LocationResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { StockAdjustmentResponse } from '../../dto/response/Stock/StockAdjustmentResponse';
import { StockMovementResponse } from '../../dto/response/Stock/StockMovementResponse';
import { StockTransferResponse } from '../../dto/response/Stock/StockTransferResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';

import { InventoryFilterRequest } from '../../dto/request/Inventory/InventoryFilterRequest';
import { ApproveStockAdjustmentRequest } from '../../dto/request/Stock/ApproveStockAdjustmentRequest';
import { CreateStockAdjustmentRequest } from '../../dto/request/Stock/CreateStockAdjustmentRequest';
import { CreateStockTransferRequest } from '../../dto/request/Stock/CreateStockTransferRequest';
import { RejectStockAdjustmentRequest } from '../../dto/request/Stock/RejectStockAdjustmentRequest';

import { ReasonType } from '../../helper/enums/ReasonType';
import { StockAdjustmentsStatus } from '../../helper/enums/StockAdjustmentsStatus';
import { StockMovementType } from '../../helper/enums/StockMovementType';
import { StockTransferReason } from '../../helper/enums/StockTransferReason';
import { StockTransferStatus } from '../../helper/enums/StockTransferStatus';
import {
  MOCK_BATCHES,
  MOCK_INVENTORIES,
  MOCK_LOCATIONS,
  MOCK_PRODUCTS,
  MOCK_STOCK_ADJUSTMENTS,
  MOCK_STOCK_MOVEMENTS,
  MOCK_STOCK_TRANSFERS,
  MOCK_WAREHOUSES,
  mockPage,
} from '../../helper/mock/mock-data';
import { AuthService } from '../../service/AuthService/auth-service.service';
import { BatchService } from '../../service/BatchService/batch.service';
import { InventoryService } from '../../service/InventoryService/inventory.service';
import { LocationService } from '../../service/Location/location.service';
import { ProductService } from '../../service/ProductService/product.service';
import {
  SearchStockAdjustmentsParams,
  StockAdjustmentService,
  StockMovementService,
  StockTransferService,
} from '../../service/StockService/stock.service';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';

type ViewMode = 'grid' | 'list';

interface StockAdjustmentFilters {
  adjustment_number: string;
  status: string;
  warehouse_id: string;
  inventory_id: string;
  created_from: string;
  created_to: string;
}

interface StockAdjustmentViewModel extends StockAdjustmentResponse {
  product_name?: string;
  product_sku?: string;
  warehouse_name?: string;
  warehouse_code?: string;
  location_name?: string;
  location_code?: string;
  batch_number?: string | null;
  uom_code?: string;
}

interface StockTransferViewModel extends StockTransferResponse {
  product_name?: string;
  product_sku?: string;
  warehouse_name?: string;
  warehouse_code?: string;
  from_location_name?: string;
  from_location_code?: string;
  to_location_name?: string;
  to_location_code?: string;
  batch_number?: string | null;
  uom_code?: string;
}

interface StockTransferForm extends Omit<CreateStockTransferRequest, 'quantity'> {
  quantity: number | null;
  notes: string;
}

function errorMessage(error: unknown, fallback: string): string {
  const response = error as { error?: ApiResponse<unknown> };
  return response?.error?.message || fallback;
}

function normalizeKeyword(value: string): string {
  return value.trim().toLowerCase();
}

function matchesKeyword(values: Array<string | number | null | undefined>, keyword: string): boolean {
  if (!keyword) {
    return true;
  }

  return values.some((value) => String(value ?? '').toLowerCase().includes(keyword));
}

function hasNoFractionOverflow(value: number): boolean {
  const raw = String(value);
  if (raw.includes('e') || raw.includes('E')) {
    return false;
  }

  const [integerPart, fractionPart = ''] = raw.split('.');
  return integerPart.replace('-', '').length <= 13 && fractionPart.length <= 2;
}

@Component({
  selector: 'app-stock-movements',
  templateUrl: './stock-movements.component.html',
  styleUrls: ['./stock-movements.component.css'],
})
export class StockMovementsComponent implements OnInit {
  readonly StockMovementType = StockMovementType;

  movements: StockMovementResponse[] = [];
  private allMovements: StockMovementResponse[] = [];

  loading = false;
  viewMode: ViewMode = 'list';
  searchKeyword = '';
  selectedType = '';

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  constructor(
    private readonly stockMovementService: StockMovementService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading = true;

    this.stockMovementService
      .getAll(0, 100)
      .pipe(
        map((response) => response.data.content),
        catchError((error) => {
          this.toastr.warning(
            errorMessage(error, 'Khong tai duoc lich su kho tu backend. Dang dung du lieu mock.'),
            'Stock Movement'
          );
          return of(MOCK_STOCK_MOVEMENTS);
        })
      )
      .subscribe((movements) => {
        this.allMovements = movements;
        this.currentPage = 0;
        this.applyFilters();
        this.loading = false;
      });
  }

  applyFilters(): void {
    const keyword = normalizeKeyword(this.searchKeyword);
    let filtered = [...this.allMovements];

    if (keyword) {
      filtered = filtered.filter((movement) =>
        matchesKeyword(
          [
            movement.movement_number,
            movement.product_name,
            movement.product_sku,
            movement.reference_id,
            movement.reference_type,
            movement.batch_number,
          ],
          keyword
        )
      );
    }

    if (this.selectedType) {
      filtered = filtered.filter((movement) => movement.type === this.selectedType);
    }

    this.totalElements = filtered.length;
    this.totalPages = Math.ceil(filtered.length / this.pageSize);

    if (this.totalPages > 0 && this.currentPage >= this.totalPages) {
      this.currentPage = this.totalPages - 1;
    }

    const start = this.currentPage * this.pageSize;
    this.movements = filtered.slice(start, start + this.pageSize);
  }

  onSearch(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedType = '';
    this.currentPage = 0;
    this.applyFilters();
  }

  onPageChange(page: number): void {
    if (page < 0 || (this.totalPages > 0 && page >= this.totalPages)) {
      return;
    }

    this.currentPage = page;
    this.applyFilters();
  }

  getTypeLabel(type: StockMovementType): string {
    switch (type) {
      case StockMovementType.INBOUND:
        return 'Nhap kho';
      case StockMovementType.OUTBOUND:
        return 'Xuat kho';
      case StockMovementType.ADJUSTMENT_INCREASE:
        return 'Dieu chinh tang';
      case StockMovementType.ADJUSTMENT_DECREASE:
        return 'Dieu chinh giam';
      case StockMovementType.TRANSFER_OUT:
        return 'Chuyen ra';
      case StockMovementType.TRANSFER_IN:
        return 'Chuyen vao';
      case StockMovementType.RESERVE:
        return 'Dat truoc';
      case StockMovementType.UNRESERVE:
        return 'Bo dat truoc';
      default:
        return type;
    }
  }

  getTypeClass(type: StockMovementType): string {
    switch (type) {
      case StockMovementType.INBOUND:
      case StockMovementType.TRANSFER_IN:
      case StockMovementType.ADJUSTMENT_INCREASE:
      case StockMovementType.UNRESERVE:
        return 'status-active';
      case StockMovementType.OUTBOUND:
      case StockMovementType.TRANSFER_OUT:
      case StockMovementType.ADJUSTMENT_DECREASE:
      case StockMovementType.RESERVE:
        return 'status-pending';
      default:
        return 'status-inactive';
    }
  }
}

@Component({
  selector: 'app-stock-adjustments',
  templateUrl: './stock-adjustments.component.html',
  styleUrls: ['./stock-adjustments.component.css'],
})
export class StockAdjustmentsComponent implements OnInit, OnDestroy {
  readonly ReasonType = ReasonType;
  readonly StockAdjustmentsStatus = StockAdjustmentsStatus;

  adjustments: StockAdjustmentViewModel[] = [];

  warehouses: WareHouseResponse[] = [];
  products: ProductResponse[] = [];
  locations: LocationResponse[] = [];
  batches: BatchResponse[] = [];
  allInventories: InventoryResponse[] = [];

  loading = false;
  actionLoading = false;
  inventoryLoading = false;
  viewMode: ViewMode = 'list';

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  roles: string[] = [];
  isAdminReviewer = false;
  private readonly subscriptions = new Subscription();

  filters: StockAdjustmentFilters = this.createEmptyFilters();

  showCreateModal = false;
  showDetailModal = false;
  showApproveModal = false;
  showRejectModal = false;

  selectedAdjustment: StockAdjustmentViewModel | null = null;
  selectedInventory: InventoryResponse | null = null;

  createWarehouseId = '';
  inventorySearchKeyword = '';
  inventoryOptions: InventoryResponse[] = [];
  private inventoryPool: InventoryResponse[] = [];

  createForm: {
    inventory_id: string;
    quantity_after: number | null;
    reason: ReasonType;
    notes: string;
  } = this.createEmptyAdjustmentForm();

  approveForm: { approval_note: string } = { approval_note: '' };
  rejectForm: { rejection_reason: string } = { rejection_reason: '' };

  constructor(
    private readonly authService: AuthService,
    private readonly stockAdjustmentService: StockAdjustmentService,
    private readonly warehouseService: WarehouseService,
    private readonly inventoryService: InventoryService,
    private readonly productService: ProductService,
    private readonly locationService: LocationService,
    private readonly batchService: BatchService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.authState$.subscribe((state) => {
        this.roles = state.roles || [];
        this.isAdminReviewer = this.roles.some((role) => role.toUpperCase().includes('ADMIN'));
      })
    );

    this.loadLookupData();
    this.loadAdjustments();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private createEmptyFilters(): StockAdjustmentFilters {
    return {
      adjustment_number: '',
      status: '',
      warehouse_id: '',
      inventory_id: '',
      created_from: '',
      created_to: '',
    };
  }

  private createEmptyAdjustmentForm(): {
    inventory_id: string;
    quantity_after: number | null;
    reason: ReasonType;
    notes: string;
  } {
    return {
      inventory_id: '',
      quantity_after: null,
      reason: ReasonType.COUNT_ERROR,
      notes: '',
    };
  }

  private loadLookupData(): void {
    forkJoin({
      warehouses: this.warehouseService.getList().pipe(
        map((response) => response.data),
        catchError(() => of(MOCK_WAREHOUSES))
      ),
      products: this.productService.getAll(0, 100).pipe(
        map((response) => response.data.content),
        catchError(() => of(MOCK_PRODUCTS))
      ),
      locations: this.locationService.getAll(0, 100).pipe(
        map((response) => response.data.content),
        catchError(() => of(MOCK_LOCATIONS))
      ),
      batches: this.batchService.getAll(0, 100).pipe(
        map((response) => response.data.content),
        catchError(() => of(MOCK_BATCHES))
      ),
      inventories: this.inventoryService.getAll(0, 100).pipe(
        map((response) => response.data.content),
        catchError(() => of(MOCK_INVENTORIES))
      ),
    }).subscribe((result) => {
      this.warehouses = result.warehouses;
      this.products = result.products;
      this.locations = result.locations;
      this.batches = result.batches;
      this.allInventories = result.inventories;
      this.applyInventoryFilter();
      this.adjustments = this.adjustments.map((adjustment) => this.enrichAdjustment(adjustment));
    });
  }

  private buildSearchParams(): SearchStockAdjustmentsParams | undefined {
    const filters: SearchStockAdjustmentsParams = {};

    if (this.filters.status) {
      filters.status = this.filters.status as StockAdjustmentsStatus;
    }
    if (this.filters.warehouse_id) {
      filters.warehouseId = this.filters.warehouse_id;
    }
    if (this.filters.inventory_id) {
      filters.inventoryId = this.filters.inventory_id;
    }
    if (this.filters.adjustment_number) {
      filters.adjustmentNumber = this.filters.adjustment_number.trim();
    }
    if (this.filters.created_from) {
      filters.createdFrom = this.filters.created_from;
    }
    if (this.filters.created_to) {
      filters.createdTo = this.filters.created_to;
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  private getMockAdjustmentsPage(page: number): PageResponse<StockAdjustmentResponse> {
    let items = [...MOCK_STOCK_ADJUSTMENTS];

    if (this.filters.status) {
      items = items.filter((adjustment) => adjustment.status === this.filters.status);
    }
    if (this.filters.warehouse_id) {
      items = items.filter((adjustment) => adjustment.warehouse_id === this.filters.warehouse_id);
    }
    if (this.filters.inventory_id) {
      const keyword = normalizeKeyword(this.filters.inventory_id);
      items = items.filter((adjustment) => adjustment.inventory_id.toLowerCase().includes(keyword));
    }
    if (this.filters.adjustment_number) {
      const keyword = normalizeKeyword(this.filters.adjustment_number);
      items = items.filter((adjustment) => adjustment.adjustment_number.toLowerCase().includes(keyword));
    }
    if (this.filters.created_from) {
      const createdFrom = new Date(this.filters.created_from).getTime();
      items = items.filter((adjustment) => new Date(adjustment.created_at).getTime() >= createdFrom);
    }
    if (this.filters.created_to) {
      const createdTo = new Date(this.filters.created_to).getTime();
      items = items.filter((adjustment) => new Date(adjustment.created_at).getTime() <= createdTo);
    }

    return mockPage(items, page, this.pageSize);
  }

  loadAdjustments(page = this.currentPage): void {
    this.loading = true;

    this.stockAdjustmentService
      .getAll(page, this.pageSize, this.buildSearchParams())
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          this.toastr.warning(
            errorMessage(error, 'Khong tai duoc danh sach stock adjustment tu backend. Dang dung du lieu mock.'),
            'Stock Adjustment'
          );
          return of(this.getMockAdjustmentsPage(page));
        })
      )
      .subscribe((pageResponse) => {
        this.currentPage = pageResponse.page;
        this.totalPages = pageResponse.total_pages;
        this.totalElements = pageResponse.total_elements;
        this.adjustments = pageResponse.content.map((adjustment) => this.enrichAdjustment(adjustment));
        this.pendingCount = this.adjustments.filter(
          (adjustment) => adjustment.status === StockAdjustmentsStatus.PENDING_APPROVAL
        ).length;
        this.approvedCount = this.adjustments.filter(
          (adjustment) => adjustment.status === StockAdjustmentsStatus.APPROVED
        ).length;
        this.rejectedCount = this.adjustments.filter(
          (adjustment) => adjustment.status === StockAdjustmentsStatus.REJECTED
        ).length;
        this.loading = false;
      });
  }

  private enrichAdjustment(adjustment: StockAdjustmentResponse): StockAdjustmentViewModel {
    const inventory = this.allInventories.find((item) => item.id === adjustment.inventory_id);
    const product = this.products.find((item) => item.id === adjustment.product_id);
    const location = this.locations.find((item) => item.id === adjustment.location_id);
    const warehouse = this.warehouses.find((item) => item.id === adjustment.warehouse_id);
    const batch = this.batches.find((item) => item.id === adjustment.batch_id);

    return {
      ...adjustment,
      product_name: inventory?.product_name || product?.name || adjustment.product_id,
      product_sku: inventory?.product_sku || product?.sku || '',
      warehouse_name: inventory?.warehouse_name || warehouse?.name || adjustment.warehouse_id,
      warehouse_code: warehouse?.code || '',
      location_name: inventory?.location_name || location?.name || adjustment.location_id,
      location_code: inventory?.location_code || location?.code || '',
      batch_number: inventory?.batch_number || batch?.batch_number || null,
      uom_code: inventory?.uom_code || product?.uom_code || '',
    };
  }

  onSearch(): void {
    if (this.filters.created_from && this.filters.created_to) {
      const createdFrom = new Date(this.filters.created_from).getTime();
      const createdTo = new Date(this.filters.created_to).getTime();
      if (createdFrom > createdTo) {
        this.toastr.error('createdFrom khong duoc lon hon createdTo.');
        return;
      }
    }

    this.currentPage = 0;
    this.loadAdjustments(0);
  }

  onResetFilters(): void {
    this.filters = this.createEmptyFilters();
    this.currentPage = 0;
    this.loadAdjustments(0);
  }

  onPageChange(page: number): void {
    if (page < 0 || (this.totalPages > 0 && page >= this.totalPages)) {
      return;
    }

    this.loadAdjustments(page);
  }

  openCreateModal(): void {
    this.closeAllModals();
    this.showCreateModal = true;
    this.createWarehouseId = '';
    this.inventorySearchKeyword = '';
    this.createForm = this.createEmptyAdjustmentForm();
    this.selectedInventory = null;
    this.inventoryPool = [...this.allInventories];
    this.applyInventoryFilter();
    this.loadCreateInventories();
  }

  openDetailModal(adjustment: StockAdjustmentViewModel): void {
    this.closeAllModals();
    this.selectedAdjustment = adjustment;
    this.showDetailModal = true;
    this.refreshAdjustment(adjustment.id);
  }

  openApproveModal(adjustment: StockAdjustmentViewModel): void {
    this.closeAllModals();
    this.selectedAdjustment = adjustment;
    this.approveForm = { approval_note: '' };
    this.showApproveModal = true;
  }

  openRejectModal(adjustment: StockAdjustmentViewModel): void {
    this.closeAllModals();
    this.selectedAdjustment = adjustment;
    this.rejectForm = { rejection_reason: '' };
    this.showRejectModal = true;
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showDetailModal = false;
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.actionLoading = false;
  }

  private refreshAdjustment(id: string): void {
    this.stockAdjustmentService
      .getById(id)
      .pipe(
        map((response) => this.enrichAdjustment(response.data)),
        catchError(() => of(null))
      )
      .subscribe((adjustment) => {
        if (!adjustment) {
          return;
        }
        this.selectedAdjustment = adjustment;
        const index = this.adjustments.findIndex((item) => item.id === adjustment.id);
        if (index >= 0) {
          this.adjustments[index] = adjustment;
        }
      });
  }

  private loadCreateInventories(): void {
    this.inventoryLoading = true;

    const filters: InventoryFilterRequest | undefined = this.createWarehouseId
      ? { warehouse_id: this.createWarehouseId }
      : undefined;

    this.inventoryService
      .getAll(0, 100, filters)
      .pipe(
        map((response) => response.data.content),
        catchError(() => {
          const fallback = this.createWarehouseId
            ? MOCK_INVENTORIES.filter((inventory) => inventory.warehouse_id === this.createWarehouseId)
            : MOCK_INVENTORIES;
          return of(fallback);
        })
      )
      .subscribe((inventories) => {
        this.inventoryLoading = false;
        this.inventoryPool = inventories;
        this.mergeInventories(inventories);
        this.applyInventoryFilter();
      });
  }

  private mergeInventories(inventories: InventoryResponse[]): void {
    const inventoryMap = new Map(this.allInventories.map((inventory) => [inventory.id, inventory]));
    inventories.forEach((inventory) => inventoryMap.set(inventory.id, inventory));
    this.allInventories = Array.from(inventoryMap.values());
  }

  onCreateWarehouseChange(): void {
    this.createForm.inventory_id = '';
    this.createForm.quantity_after = null;
    this.selectedInventory = null;
    this.inventorySearchKeyword = '';
    this.loadCreateInventories();
  }

  onInventorySearchKeywordChange(keyword: string): void {
    this.inventorySearchKeyword = keyword;
    this.applyInventoryFilter();
  }

  private applyInventoryFilter(): void {
    const keyword = normalizeKeyword(this.inventorySearchKeyword);

    this.inventoryOptions = this.inventoryPool.filter((inventory) =>
      matchesKeyword(
        [
          inventory.product_sku,
          inventory.product_name,
          inventory.location_code,
          inventory.location_name,
          inventory.batch_number,
          inventory.warehouse_name,
        ],
        keyword
      )
    );

    if (
      this.createForm.inventory_id &&
      !this.inventoryOptions.some((inventory) => inventory.id === this.createForm.inventory_id)
    ) {
      this.createForm.inventory_id = '';
      this.selectedInventory = null;
    }
  }

  onInventorySelected(inventoryId: string): void {
    this.createForm.inventory_id = inventoryId;
    this.selectedInventory =
      this.inventoryPool.find((inventory) => inventory.id === inventoryId) ||
      this.allInventories.find((inventory) => inventory.id === inventoryId) ||
      null;

    if (this.selectedInventory && this.createForm.quantity_after === null) {
      this.createForm.quantity_after = this.selectedInventory.quantity_on_hand;
    }
  }

  get quantityDeltaPreview(): number | null {
    if (!this.selectedInventory || this.createForm.quantity_after === null) {
      return null;
    }

    return Number(this.createForm.quantity_after) - Number(this.selectedInventory.quantity_on_hand);
  }

  get requiresApprovalPreview(): boolean {
    if (this.quantityDeltaPreview === null) {
      return true;
    }

    const roleSet = this.roles.map((role) => role.toUpperCase());
    if (roleSet.some((role) => role.includes('ADMIN'))) {
      return false;
    }
    if (roleSet.some((role) => role.includes('MANAGER'))) {
      return (
        [ReasonType.THEFT, ReasonType.SYSTEM_ERROR].includes(this.createForm.reason) ||
        Math.abs(this.quantityDeltaPreview) >= 5
      );
    }
    return true;
  }

  get createFlowMessage(): string {
    if (!this.selectedInventory || this.quantityDeltaPreview === null) {
      return 'Theo backend, phiếu điều chỉnh lấy inventory làm nguồn sự thật. Nếu không cần duyệt, tồn kho và stock movement sẽ được cập nhật ngay.';
    }

    if (this.requiresApprovalPreview) {
      return 'Theo rule BE hiện tại, phiếu này sẽ vào trạng thái chờ duyệt. Tồn kho chỉ thay đổi sau khi admin phê duyệt.';
    }

    return 'Theo rule BE hiện tại, phiếu này có thể được áp dụng ngay sau khi tạo và sinh movement ADJUSTMENT_INCREASE hoặc ADJUSTMENT_DECREASE.';
  }

  onCreateSubmit(): void {
    if (!this.selectedInventory || !this.createForm.inventory_id) {
      this.toastr.error('Bạn phải chọn inventory cần điều chỉnh.');
      return;
    }

    if (this.createForm.quantity_after === null || Number.isNaN(Number(this.createForm.quantity_after))) {
      this.toastr.error('Số lượng sau điều chỉnh là bắt buộc.');
      return;
    }

    const quantityAfter = Number(this.createForm.quantity_after);
    if (!Number.isFinite(quantityAfter) || quantityAfter < 0) {
      this.toastr.error('Số lượng sau điều chỉnh phải >= 0.');
      return;
    }

    if (!hasNoFractionOverflow(quantityAfter)) {
      this.toastr.error('Số lượng sau điều chỉnh chỉ được tối đa 13 chữ số nguyên và 2 chữ số thập phân.');
      return;
    }

    if (quantityAfter < this.selectedInventory.quantity_reserved) {
      this.toastr.error('Số lượng sau điều chỉnh không được nhỏ hơn số lượng đã giữ chỗ.');
      return;
    }

    if (quantityAfter === this.selectedInventory.quantity_on_hand) {
      this.toastr.error('Backend không chấp nhận điều chỉnh có biến động bằng 0.');
      return;
    }

    if (this.createForm.notes.trim().length > 2000) {
      this.toastr.error('Ghi chú không được vượt quá 2000 ký tự.');
      return;
    }

    const request: CreateStockAdjustmentRequest = {
      inventory_id: this.selectedInventory.id,
      quantity_after: quantityAfter,
      reason: this.createForm.reason,
      notes: this.createForm.notes.trim() || undefined,
    };

    this.actionLoading = true;

    this.stockAdjustmentService.create(request).subscribe({
      next: (response) => {
        const adjustment = this.enrichAdjustment(response.data);
        this.toastr.success(
          adjustment.requires_approval
            ? 'Đã tạo phiếu điều chỉnh ở trạng thái chờ duyệt.'
            : 'Đã tạo phiếu điều chỉnh và áp dụng tồn kho.',
          'Stock Adjustment'
        );
        this.actionLoading = false;
        this.closeAllModals();
        this.selectedAdjustment = adjustment;
        this.loadLookupData();
        this.loadAdjustments(0);
      },
      error: (error) => {
        this.actionLoading = false;
        this.toastr.error(errorMessage(error, 'Tạo phiếu điều chỉnh thất bại.'));
      },
    });
  }

  onApproveSubmit(): void {
    if (!this.selectedAdjustment) {
      return;
    }

    const approvalNote = this.approveForm.approval_note.trim();
    if (approvalNote.length > 500) {
      this.toastr.error('Ghi chú phê duyệt không được vượt quá 500 ký tự.');
      return;
    }

    const request: ApproveStockAdjustmentRequest = approvalNote
      ? { approval_note: approvalNote }
      : {};

    this.actionLoading = true;

    this.stockAdjustmentService.approve(this.selectedAdjustment.id, request).subscribe({
      next: (response) => {
        this.toastr.success('Đã phê duyệt phiếu điều chỉnh.', 'Stock Adjustment');
        this.actionLoading = false;
        this.closeAllModals();
        this.selectedAdjustment = this.enrichAdjustment(response.data);
        this.loadLookupData();
        this.loadAdjustments(this.currentPage);
      },
      error: (error) => {
        this.actionLoading = false;
        this.toastr.error(errorMessage(error, 'Phê duyệt phiếu điều chỉnh thất bại.'));
      },
    });
  }

  onRejectSubmit(): void {
    if (!this.selectedAdjustment) {
      return;
    }

    const rejectionReason = this.rejectForm.rejection_reason.trim();
    if (!rejectionReason) {
      this.toastr.error('Lý do từ chối là bắt buộc.');
      return;
    }
    if (rejectionReason.length > 500) {
      this.toastr.error('Lý do từ chối không được vượt quá 500 ký tự.');
      return;
    }

    const request: RejectStockAdjustmentRequest = {
      rejection_reason: rejectionReason,
    };

    this.actionLoading = true;

    this.stockAdjustmentService.reject(this.selectedAdjustment.id, request).subscribe({
      next: (response) => {
        this.toastr.success('Đã từ chối phiếu điều chỉnh.', 'Stock Adjustment');
        this.actionLoading = false;
        this.closeAllModals();
        this.selectedAdjustment = this.enrichAdjustment(response.data);
        this.loadAdjustments(this.currentPage);
      },
      error: (error) => {
        this.actionLoading = false;
        this.toastr.error(errorMessage(error, 'Từ chối phiếu điều chỉnh thất bại.'));
      },
    });
  }

  getInventoryOptionLabel(inventory: InventoryResponse): string {
    const batchSegment = inventory.batch_number ? ` | Lo: ${inventory.batch_number}` : '';
    return `${inventory.product_sku} | ${inventory.location_code} | On hand: ${inventory.quantity_on_hand} | Reserved: ${inventory.quantity_reserved}${batchSegment}`;
  }

  getProductDisplay(adjustment: StockAdjustmentViewModel): string {
    const name = adjustment.product_name || adjustment.product_id;
    return adjustment.product_sku ? `${adjustment.product_sku} - ${name}` : name;
  }

  getBatchDisplay(adjustment: StockAdjustmentViewModel): string {
    return adjustment.batch_number || 'Khong co lo';
  }

  getLocationDisplay(adjustment: StockAdjustmentViewModel): string {
    const code = adjustment.location_code || adjustment.location_id;
    return adjustment.location_name ? `${code} - ${adjustment.location_name}` : code;
  }

  getWarehouseDisplay(adjustment: StockAdjustmentViewModel): string {
    const code = adjustment.warehouse_code || adjustment.warehouse_id;
    return adjustment.warehouse_name ? `${code} - ${adjustment.warehouse_name}` : code;
  }

  getReasonLabel(reason: ReasonType): string {
    switch (reason) {
      case ReasonType.DAMAGE:
        return 'Hu hong';
      case ReasonType.THEFT:
        return 'That thoat / mat cap';
      case ReasonType.COUNT_ERROR:
        return 'Sai lech kiem dem';
      case ReasonType.EXPIRED:
        return 'Het han';
      case ReasonType.QUALITY_ISSUE:
        return 'Van de chat luong';
      case ReasonType.SYSTEM_ERROR:
        return 'Loi he thong';
      case ReasonType.OTHER:
        return 'Khac';
      default:
        return reason;
    }
  }

  getStatusLabel(status: StockAdjustmentsStatus): string {
    switch (status) {
      case StockAdjustmentsStatus.PENDING_APPROVAL:
        return 'Cho duyet';
      case StockAdjustmentsStatus.APPROVED:
        return 'Da duyet';
      case StockAdjustmentsStatus.REJECTED:
        return 'Da tu choi';
      default:
        return status;
    }
  }

  getStatusClass(status: StockAdjustmentsStatus): string {
    switch (status) {
      case StockAdjustmentsStatus.PENDING_APPROVAL:
        return 'status-pending';
      case StockAdjustmentsStatus.APPROVED:
        return 'status-active';
      case StockAdjustmentsStatus.REJECTED:
        return 'status-inactive';
      default:
        return 'status-inactive';
    }
  }

  getAdjustmentQuantityClass(quantity: number): string {
    if (quantity > 0) {
      return 'text-success';
    }
    if (quantity < 0) {
      return 'text-danger';
    }
    return '';
  }

  getSignedQuantity(quantity: number): string {
    if (quantity > 0) {
      return `+${quantity}`;
    }
    return `${quantity}`;
  }
}

@Component({
  selector: 'app-stock-transfers',
  templateUrl: './stock-transfers.component.html',
  styleUrls: ['./stock-transfers.component.css'],
})
export class StockTransfersComponent implements OnInit {
  readonly StockTransferStatus = StockTransferStatus;

  transfers: StockTransferViewModel[] = [];

  warehouses: WareHouseResponse[] = [];
  products: ProductResponse[] = [];
  locations: LocationResponse[] = [];
  batches: BatchResponse[] = [];

  loading = false;
  loadingCreateOptions = false;
  submitting = false;
  viewMode: ViewMode = 'list';

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  draftCount = 0;
  completedCount = 0;
  cancelledCount = 0;

  showCreateModal = false;
  showDetailModal = false;
  showCompleteModal = false;
  showCancelModal = false;

  selectedTransfer: StockTransferViewModel | null = null;
  actionTransfer: StockTransferViewModel | null = null;

  sourceInventories: InventoryResponse[] = [];
  selectedSourceInventory: InventoryResponse | null = null;
  destinationLocations: LocationResponse[] = [];
  private warehouseLocations: LocationResponse[] = [];
  selectedSourceInventoryId = '';

  transferReasons = Object.values(StockTransferReason) as StockTransferReason[];

  createForm: StockTransferForm = this.createEmptyTransferForm();

  constructor(
    private readonly stockTransferService: StockTransferService,
    private readonly warehouseService: WarehouseService,
    private readonly inventoryService: InventoryService,
    private readonly locationService: LocationService,
    private readonly productService: ProductService,
    private readonly batchService: BatchService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadLookupData();
    this.loadTransfers();
  }

  private createEmptyTransferForm(): StockTransferForm {
    return {
      product_id: '',
      warehouse_id: '',
      from_location_id: '',
      to_location_id: '',
      batch_id: undefined,
      quantity: null,
      reason: StockTransferReason.REORG,
      notes: '',
    };
  }

  private loadLookupData(): void {
    forkJoin({
      warehouses: this.warehouseService.getList().pipe(
        map((response) => response.data),
        catchError(() => of(MOCK_WAREHOUSES))
      ),
      products: this.productService.getAll(0, 100).pipe(
        map((response) => response.data.content),
        catchError(() => of(MOCK_PRODUCTS))
      ),
      locations: this.locationService.getAll(0, 100).pipe(
        map((response) => response.data.content),
        catchError(() => of(MOCK_LOCATIONS))
      ),
      batches: this.batchService.getAll(0, 100).pipe(
        map((response) => response.data.content),
        catchError(() => of(MOCK_BATCHES))
      ),
    }).subscribe((result) => {
      this.warehouses = result.warehouses;
      this.products = result.products;
      this.locations = result.locations;
      this.batches = result.batches;
      this.transfers = this.transfers.map((transfer) => this.enrichTransfer(transfer));
    });
  }

  private getMockTransfersPage(page: number): PageResponse<StockTransferResponse> {
    return mockPage(MOCK_STOCK_TRANSFERS, page, this.pageSize);
  }

  loadTransfers(page = this.currentPage): void {
    this.loading = true;

    this.stockTransferService
      .getAll(page, this.pageSize)
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          this.toastr.warning(
            errorMessage(error, 'Khong tai duoc danh sach stock transfer tu backend. Dang dung du lieu mock.'),
            'Stock Transfer'
          );
          return of(this.getMockTransfersPage(page));
        })
      )
      .subscribe((pageResponse) => {
        this.currentPage = pageResponse.page;
        this.totalPages = pageResponse.total_pages;
        this.totalElements = pageResponse.total_elements;
        this.transfers = pageResponse.content.map((transfer) => this.enrichTransfer(transfer));
        this.draftCount = this.transfers.filter((transfer) => transfer.status === StockTransferStatus.DRAFT).length;
        this.completedCount = this.transfers.filter(
          (transfer) => transfer.status === StockTransferStatus.COMPLETED
        ).length;
        this.cancelledCount = this.transfers.filter(
          (transfer) => transfer.status === StockTransferStatus.CANCELLED
        ).length;
        this.loading = false;
      });
  }

  private enrichTransfer(transfer: StockTransferResponse): StockTransferViewModel {
    const product = this.products.find((item) => item.id === transfer.product_id);
    const warehouse = this.warehouses.find((item) => item.id === transfer.warehouse_id);
    const fromLocation = this.locations.find((item) => item.id === transfer.from_location_id);
    const toLocation = this.locations.find((item) => item.id === transfer.to_location_id);
    const batch = this.batches.find((item) => item.id === transfer.batch_id);

    return {
      ...transfer,
      product_name: product?.name || transfer.product_id,
      product_sku: product?.sku || '',
      warehouse_name: warehouse?.name || transfer.warehouse_id,
      warehouse_code: warehouse?.code || '',
      from_location_name: fromLocation?.name || transfer.from_location_id,
      from_location_code: fromLocation?.code || '',
      to_location_name: toLocation?.name || transfer.to_location_id,
      to_location_code: toLocation?.code || '',
      batch_number: batch?.batch_number || null,
      uom_code: product?.uom_code || '',
    };
  }

  onPageChange(page: number): void {
    if (page < 0 || (this.totalPages > 0 && page >= this.totalPages)) {
      return;
    }

    this.loadTransfers(page);
  }

  openCreateModal(): void {
    this.closeAllModals();
    this.showCreateModal = true;
    this.createForm = this.createEmptyTransferForm();
    this.selectedSourceInventoryId = '';
    this.selectedSourceInventory = null;
    this.sourceInventories = [];
    this.destinationLocations = [];
    this.warehouseLocations = [];
  }

  openDetailModal(transfer: StockTransferViewModel): void {
    this.closeAllModals();
    this.selectedTransfer = transfer;
    this.showDetailModal = true;
    this.refreshTransfer(transfer.id);
  }

  openCompleteModal(transfer: StockTransferViewModel): void {
    if (!this.canUpdateTransfer(transfer)) {
      return;
    }

    this.closeAllModals();
    this.actionTransfer = transfer;
    this.showCompleteModal = true;
  }

  openCancelModal(transfer: StockTransferViewModel): void {
    if (!this.canUpdateTransfer(transfer)) {
      return;
    }

    this.closeAllModals();
    this.actionTransfer = transfer;
    this.showCancelModal = true;
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showDetailModal = false;
    this.showCompleteModal = false;
    this.showCancelModal = false;
    this.selectedTransfer = null;
    this.actionTransfer = null;
    this.submitting = false;
  }

  private refreshTransfer(id: string): void {
    this.stockTransferService
      .getById(id)
      .pipe(
        map((response) => this.enrichTransfer(response.data)),
        catchError(() => of(null))
      )
      .subscribe((transfer) => {
        if (!transfer) {
          return;
        }
        this.selectedTransfer = transfer;
        const index = this.transfers.findIndex((item) => item.id === transfer.id);
        if (index >= 0) {
          this.transfers[index] = transfer;
        }
      });
  }

  onWarehouseChange(): void {
    this.selectedSourceInventoryId = '';
    this.selectedSourceInventory = null;
    this.sourceInventories = [];
    this.destinationLocations = [];
    this.warehouseLocations = [];
    this.createForm.product_id = '';
    this.createForm.from_location_id = '';
    this.createForm.to_location_id = '';
    this.createForm.batch_id = undefined;

    if (!this.createForm.warehouse_id) {
      return;
    }

    this.loadingCreateOptions = true;

    forkJoin({
      inventories: this.inventoryService.getAll(0, 100, { warehouse_id: this.createForm.warehouse_id }).pipe(
        map((response) => response.data.content),
        catchError(() => of(MOCK_INVENTORIES.filter((item) => item.warehouse_id === this.createForm.warehouse_id)))
      ),
      locations: this.locationService.getByWarehouse(this.createForm.warehouse_id, 0, 100).pipe(
        map((response) => response.data.content),
        catchError(() => of(MOCK_LOCATIONS.filter((item) => item.warehouse_id === this.createForm.warehouse_id)))
      ),
    }).subscribe((result) => {
      this.sourceInventories = result.inventories;
      this.warehouseLocations = result.locations;
      this.destinationLocations = [];
      this.loadingCreateOptions = false;
    });
  }

  onSourceInventoryChange(): void {
    this.selectedSourceInventory =
      this.sourceInventories.find((inventory) => inventory.id === this.selectedSourceInventoryId) || null;

    if (!this.selectedSourceInventory) {
      this.createForm.product_id = '';
      this.createForm.from_location_id = '';
      this.createForm.to_location_id = '';
      this.createForm.batch_id = undefined;
      this.destinationLocations = [];
      return;
    }

    this.createForm.product_id = this.selectedSourceInventory.product_id;
    this.createForm.warehouse_id = this.selectedSourceInventory.warehouse_id;
    this.createForm.from_location_id = this.selectedSourceInventory.location_id;
    this.createForm.batch_id = this.selectedSourceInventory.batch_id || undefined;
    this.createForm.to_location_id = '';
    this.destinationLocations = this.warehouseLocations.filter(
      (location) => location.id !== this.selectedSourceInventory?.location_id
    );
  }

  get quantityPreviewWarning(): string {
    if (!this.selectedSourceInventory || this.createForm.quantity === null || this.createForm.quantity <= 0) {
      return '';
    }

    if (this.createForm.quantity > this.selectedSourceInventory.quantity_available) {
      return 'Số lượng đang nhập lớn hơn tồn khả dụng hiện tại. Backend chỉ kiểm tra tồn thật ở bước complete, vì vậy create vẫn có thể thành công nhưng complete có thể bị chặn.';
    }

    return '';
  }

  onCreateSubmit(): void {
    if (!this.createForm.warehouse_id) {
      this.toastr.error('Kho là bắt buộc.');
      return;
    }

    if (!this.selectedSourceInventory) {
      this.toastr.error('Bạn phải chọn tồn nguồn.');
      return;
    }

    if (this.selectedSourceInventory.warehouse_id !== this.createForm.warehouse_id) {
      this.toastr.error('Tồn nguồn không thuộc kho đã chọn.');
      return;
    }

    if (!this.createForm.product_id || !this.createForm.from_location_id) {
      this.toastr.error('Thông tin sản phẩm và vị trí nguồn phải được lấy từ tồn nguồn.');
      return;
    }

    if (!this.createForm.to_location_id) {
      this.toastr.error('Vị trí đích là bắt buộc.');
      return;
    }

    if (this.createForm.to_location_id === this.createForm.from_location_id) {
      this.toastr.error('Vị trí nguồn và đích không được trùng nhau.');
      return;
    }

    if (this.createForm.quantity === null || !Number.isFinite(Number(this.createForm.quantity))) {
      this.toastr.error('Số lượng chuyển là bắt buộc.');
      return;
    }

    const quantity = Number(this.createForm.quantity);
    if (quantity <= 0) {
      this.toastr.error('Số lượng chuyển phải > 0.');
      return;
    }

    if (!this.createForm.reason) {
      this.toastr.error('Lý do chuyển là bắt buộc.');
      return;
    }

    if (this.createForm.notes.trim().length > 2000) {
      this.toastr.error('Ghi chú không được vượt quá 2000 ký tự.');
      return;
    }

    if (this.quantityPreviewWarning) {
      this.toastr.warning(this.quantityPreviewWarning, 'Stock Transfer');
    }

    const request: CreateStockTransferRequest = {
      product_id: this.createForm.product_id,
      warehouse_id: this.createForm.warehouse_id,
      from_location_id: this.createForm.from_location_id,
      to_location_id: this.createForm.to_location_id,
      batch_id: this.createForm.batch_id,
      quantity,
      reason: this.createForm.reason,
      notes: this.createForm.notes.trim() || undefined,
    };

    this.submitting = true;

    this.stockTransferService.create(request).subscribe({
      next: () => {
        this.toastr.success('Đã tạo phiếu chuyển kho ở trạng thái nháp.', 'Stock Transfer');
        this.submitting = false;
        this.closeAllModals();
        this.loadTransfers(0);
      },
      error: (error) => {
        this.submitting = false;
        this.toastr.error(errorMessage(error, 'Tạo phiếu chuyển kho thất bại.'));
      },
    });
  }

  onCompleteConfirm(): void {
    if (!this.actionTransfer) {
      return;
    }

    this.submitting = true;

    this.stockTransferService.complete(this.actionTransfer.id).subscribe({
      next: () => {
        this.toastr.success('Đã hoàn tất phiếu chuyển kho.', 'Stock Transfer');
        this.submitting = false;
        this.closeAllModals();
        this.loadTransfers(this.currentPage);
      },
      error: (error) => {
        this.submitting = false;
        this.toastr.error(errorMessage(error, 'Hoàn tất phiếu chuyển kho thất bại.'));
      },
    });
  }

  onCancelConfirm(): void {
    if (!this.actionTransfer) {
      return;
    }

    this.submitting = true;

    this.stockTransferService.cancel(this.actionTransfer.id).subscribe({
      next: () => {
        this.toastr.success('Đã huỷ phiếu chuyển kho.', 'Stock Transfer');
        this.submitting = false;
        this.closeAllModals();
        this.loadTransfers(this.currentPage);
      },
      error: (error) => {
        this.submitting = false;
        this.toastr.error(errorMessage(error, 'Huỷ phiếu chuyển kho thất bại.'));
      },
    });
  }

  canUpdateTransfer(transfer: StockTransferViewModel | null): boolean {
    return transfer?.status === StockTransferStatus.DRAFT;
  }

  getWarehouseLabel(warehouseId: string): string {
    const warehouse = this.warehouses.find((item) => item.id === warehouseId);
    if (!warehouse) {
      return warehouseId;
    }
    return `${warehouse.code} - ${warehouse.name}`;
  }

  getReasonLabel(reason: StockTransferReason): string {
    switch (reason) {
      case StockTransferReason.REORG:
        return 'Sap xep lai kho';
      case StockTransferReason.PICKING_PREP:
        return 'Chuan bi lay hang';
      case StockTransferReason.OVERFLOW:
        return 'Qua tai vi tri';
      case StockTransferReason.CONSOLIDATION:
        return 'Gop ton';
      case StockTransferReason.OTHER:
        return 'Khac';
      default:
        return reason;
    }
  }

  getStatusLabel(status: StockTransferStatus): string {
    switch (status) {
      case StockTransferStatus.DRAFT:
        return 'Nhap';
      case StockTransferStatus.COMPLETED:
        return 'Hoan tat';
      case StockTransferStatus.CANCELLED:
        return 'Da huy';
      default:
        return status;
    }
  }

  getStatusClass(status: StockTransferStatus): string {
    switch (status) {
      case StockTransferStatus.DRAFT:
        return 'status-pending';
      case StockTransferStatus.COMPLETED:
        return 'status-active';
      case StockTransferStatus.CANCELLED:
        return 'status-inactive';
      default:
        return 'status-inactive';
    }
  }
}
