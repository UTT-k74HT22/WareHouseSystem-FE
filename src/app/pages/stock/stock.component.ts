import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, catchError, forkJoin, map, of } from 'rxjs';
import { StockMovementResponse } from '../../dto/response/Stock/StockMovementResponse';
import { StockAdjustmentResponse } from '../../dto/response/Stock/StockAdjustmentResponse';
import { StockTransferResponse } from '../../dto/response/Stock/StockTransferResponse';
import {
  SearchStockAdjustmentsParams,
  StockMovementService,
  StockAdjustmentService,
  StockTransferService
} from '../../service/StockService/stock.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { StockMovementType } from '../../helper/enums/StockMovementType';
import { CreateStockAdjustmentRequest } from '../../dto/request/Stock/CreateStockAdjustmentRequest';
import { CreateStockTransferRequest } from '../../dto/request/Stock/CreateStockTransferRequest';
import {
  MOCK_INVENTORIES,
  MOCK_STOCK_ADJUSTMENTS,
  MOCK_STOCK_MOVEMENTS,
  MOCK_STOCK_TRANSFERS,
  MOCK_WAREHOUSES,
  mockPage
} from '../../helper/mock/mock-data';
import { ProductService } from '../../service/ProductService/product.service';
import { LocationService } from '../../service/Location/location.service';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { LocationResponse } from '../../dto/response/Location/LocationResponse';
import { InventoryService } from '../../service/InventoryService/inventory.service';
import { InventoryResponse } from '../../dto/response/Inventory/InventoryResponse';
import { ReasonType } from '../../helper/enums/ReasonType';
import { StockAdjustmentsStatus } from '../../helper/enums/StockAdjustmentsStatus';
import { ApproveStockAdjustmentRequest } from '../../dto/request/Stock/ApproveStockAdjustmentRequest';
import { RejectStockAdjustmentRequest } from '../../dto/request/Stock/RejectStockAdjustmentRequest';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { BatchService } from '../../service/BatchService/batch.service';
import { AuthService } from '../../service/AuthService/auth-service.service';
import { InventoryFilterRequest } from '../../dto/request/Inventory/InventoryFilterRequest';

interface StockAdjustmentFilterForm {
  status: '' | StockAdjustmentsStatus;
  warehouse_id: string;
  inventory_id: string;
  adjustment_number: string;
  created_from: string;
  created_to: string;
}

interface StockAdjustmentCreateFormState {
  inventory_id: string;
  quantity_after: number | null;
  reason: ReasonType;
  notes: string;
}

type LookupResult =
  | { type: 'product'; id: string; name: string; secondary?: string }
  | { type: 'location'; id: string; name: string; secondary?: string }
  | { type: 'warehouse'; id: string; name: string }
  | { type: 'batch'; id: string; name: string };

@Component({
  selector: 'app-stock-movements',
  templateUrl: './stock-movements.component.html',
  styleUrls: ['./stock-movements.component.css']
})
export class StockMovementsComponent implements OnInit {
  movements: StockMovementResponse[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';

  selectedType: '' | StockMovementType = '';
  searchKeyword = '';

  StockMovementType = StockMovementType;

  constructor(
    private movementService: StockMovementService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading = true;
    this.movementService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.movements = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        const page = mockPage(MOCK_STOCK_MOVEMENTS, this.currentPage, this.pageSize);
        this.movements = page.content;
        this.totalElements = page.total_elements;
        this.totalPages = page.total_pages;
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadMovements();
  }

  onResetFilter(): void {
    this.selectedType = '';
    this.searchKeyword = '';
    this.loadMovements();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadMovements();
  }

  getTypeLabel(type: StockMovementType): string {
    const labels: Record<StockMovementType, string> = {
      [StockMovementType.INBOUND]: 'Nhập kho',
      [StockMovementType.OUTBOUND]: 'Xuất kho',
      [StockMovementType.TRANSFER]: 'Chuyển vị trí',
      [StockMovementType.ADJUSTMENT]: 'Điều chỉnh',
      [StockMovementType.RETURN]: 'Hoàn trả'
    };
    return labels[type];
  }

  getTypeClass(type: StockMovementType): string {
    const classes: Record<StockMovementType, string> = {
      [StockMovementType.INBOUND]: 'badge-inbound',
      [StockMovementType.OUTBOUND]: 'badge-outbound',
      [StockMovementType.TRANSFER]: 'badge-transfer',
      [StockMovementType.ADJUSTMENT]: 'badge-adjustment',
      [StockMovementType.RETURN]: 'badge-return'
    };
    return classes[type];
  }
}

@Component({
  selector: 'app-stock-adjustments',
  templateUrl: './stock-adjustments.component.html',
  styleUrls: ['./stock-adjustments.component.css']
})
export class StockAdjustmentsComponent implements OnInit, OnDestroy {
  adjustments: StockAdjustmentResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  inventoryOptions: InventoryResponse[] = [];
  selectedInventory: InventoryResponse | null = null;
  selectedAdjustment: StockAdjustmentResponse | null = null;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  actionLoading = false;
  inventoryLoading = false;
  detailLoading = false;
  viewMode: 'grid' | 'list' = 'list';

  showCreateModal = false;
  showDetailModal = false;
  showApproveModal = false;
  showRejectModal = false;

  filters: StockAdjustmentFilterForm = this.initFilters();
  createForm: StockAdjustmentCreateFormState = this.initCreateForm();
  approveForm: ApproveStockAdjustmentRequest = {};
  rejectForm: RejectStockAdjustmentRequest = { rejection_reason: '' };

  inventorySearchKeyword = '';
  createWarehouseId = '';
  roles: string[] = [];

  private readonly autocompletePageSize = 20;
  private readonly searchDebounceMs = 300;
  private inventorySearchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private authSubscription?: Subscription;

  private readonly productLookup = new Map<string, { name: string; sku?: string }>();
  private readonly locationLookup = new Map<string, { name: string; code?: string }>();
  private readonly warehouseLookup = new Map<string, string>();
  private readonly batchLookup = new Map<string, string>();

  ReasonType = ReasonType;
  StockAdjustmentsStatus = StockAdjustmentsStatus;

  constructor(
    private adjService: StockAdjustmentService,
    private productService: ProductService,
    private locationService: LocationService,
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
    private batchService: BatchService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.authState$.subscribe((state) => {
      this.roles = state.roles ?? [];
    });
    this.loadWarehouses();
    this.loadAdjustments();
  }

  ngOnDestroy(): void {
    this.clearInventorySearchDebounce();
    this.authSubscription?.unsubscribe();
  }

  get pendingCount(): number {
    return this.adjustments.filter((adjustment) => adjustment.status === StockAdjustmentsStatus.PENDING_APPROVAL).length;
  }

  get approvedCount(): number {
    return this.adjustments.filter((adjustment) => adjustment.status === StockAdjustmentsStatus.APPROVED).length;
  }

  get rejectedCount(): number {
    return this.adjustments.filter((adjustment) => adjustment.status === StockAdjustmentsStatus.REJECTED).length;
  }

  get isAdminReviewer(): boolean {
    return this.roles.includes('ADMIN');
  }

  get quantityDeltaPreview(): number | null {
    if (!this.selectedInventory || this.createForm.quantity_after === null || this.createForm.quantity_after === undefined) {
      return null;
    }
    return Number(this.createForm.quantity_after) - Number(this.selectedInventory.quantity_on_hand);
  }

  get createFlowMessage(): string {
    const delta = this.quantityDeltaPreview;
    if (!this.selectedInventory || delta === null) {
      return 'Chọn tồn kho, nhập số lượng sau điều chỉnh và lý do. Backend sẽ quyết định trạng thái cuối cùng của phiếu.';
    }

    if (delta === 0) {
      return 'Số lượng sau điều chỉnh phải khác số lượng tồn hiện tại.';
    }

    const requiresApproval = this.requiresApprovalPreview(this.createForm.reason, delta);
    return requiresApproval
      ? 'Theo rule hiện tại, phiếu này nhiều khả năng sẽ vào trạng thái chờ duyệt. Backend vẫn là nguồn xác nhận cuối cùng.'
      : 'Theo rule hiện tại, phiếu này nhiều khả năng sẽ được duyệt ngay và cập nhật tồn kho tức thì. Backend vẫn là nguồn xác nhận cuối cùng.';
  }

  loadAdjustments(): void {
    this.loading = true;
    const filters = this.buildSearchFilters();
    this.adjService.getAll(this.currentPage, this.pageSize, filters).subscribe({
      next: (res) => {
        if (res.success) {
          this.applyAdjustmentPage(res.data.content, res.data.total_elements, res.data.total_pages);
          this.enrichAdjustmentRelations(res.data.content);
        }
        this.loading = false;
      },
      error: () => {
        this.loadMockAdjustments();
        this.loading = false;
      }
    });
  }

  loadWarehouses(): void {
    this.warehouseService.getList().subscribe({
      next: (res) => {
        if (!res.success) return;
        this.warehouses = res.data;
        res.data.forEach((warehouse) => this.warehouseLookup.set(warehouse.id, warehouse.name));
      },
      error: () => {
        this.warehouses = MOCK_WAREHOUSES;
        MOCK_WAREHOUSES.forEach((warehouse) => this.warehouseLookup.set(warehouse.id, warehouse.name));
      }
    });
  }

  onSearch(): void {
    if (this.hasInvalidDateRange()) {
      this.toastr.error('Thời gian bắt đầu phải sớm hơn hoặc bằng thời gian kết thúc.');
      return;
    }
    this.currentPage = 0;
    this.loadAdjustments();
  }

  onResetFilters(): void {
    this.filters = this.initFilters();
    this.currentPage = 0;
    this.loadAdjustments();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadAdjustments();
  }

  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.inventorySearchKeyword = '';
    this.createWarehouseId = '';
    this.selectedInventory = null;
    this.inventoryOptions = [];
    this.showCreateModal = true;
    this.searchInventories();
  }

  openDetailModal(adjustment: StockAdjustmentResponse): void {
    this.fetchAdjustmentDetail(adjustment.id, (loadedAdjustment) => {
      this.selectedAdjustment = loadedAdjustment;
      this.showDetailModal = true;
    });
  }

  openApproveModal(adjustment: StockAdjustmentResponse): void {
    if (!this.isAdminReviewer) {
      this.toastr.error('Chỉ tài khoản ADMIN mới được phê duyệt phiếu điều chỉnh.');
      return;
    }

    this.showDetailModal = false;
    this.approveForm = {};
    this.fetchAdjustmentDetail(adjustment.id, (loadedAdjustment) => {
      if (loadedAdjustment.status !== StockAdjustmentsStatus.PENDING_APPROVAL) {
        this.toastr.error('Phiếu này không còn ở trạng thái chờ duyệt.');
        return;
      }
      this.selectedAdjustment = loadedAdjustment;
      this.showApproveModal = true;
    });
  }

  openRejectModal(adjustment: StockAdjustmentResponse): void {
    if (!this.isAdminReviewer) {
      this.toastr.error('Chỉ tài khoản ADMIN mới được từ chối phiếu điều chỉnh.');
      return;
    }

    this.showDetailModal = false;
    this.rejectForm = { rejection_reason: '' };
    this.fetchAdjustmentDetail(adjustment.id, (loadedAdjustment) => {
      if (loadedAdjustment.status !== StockAdjustmentsStatus.PENDING_APPROVAL) {
        this.toastr.error('Phiếu này không còn ở trạng thái chờ duyệt.');
        return;
      }
      this.selectedAdjustment = loadedAdjustment;
      this.showRejectModal = true;
    });
  }

  onInventorySearchKeywordChange(keyword: string): void {
    this.inventorySearchKeyword = keyword;
    this.clearSelectedInventory();
    this.clearInventorySearchDebounce();
    this.inventorySearchDebounceHandle = setTimeout(() => {
      this.searchInventories();
    }, this.searchDebounceMs);
  }

  onCreateWarehouseChange(): void {
    this.clearSelectedInventory();
    this.searchInventories();
  }

  onInventorySelected(inventoryId: string): void {
    this.createForm.inventory_id = inventoryId;
    this.selectedInventory = this.inventoryOptions.find((inventory) => inventory.id === inventoryId) ?? null;
    if (this.selectedInventory) {
      this.createForm.quantity_after = Number(this.selectedInventory.quantity_on_hand);
      this.seedLookupsFromInventories([this.selectedInventory]);
    }
  }

  onCreateSubmit(): void {
    if (!this.selectedInventory) {
      this.toastr.error('Vui lòng chọn đúng tồn kho cần điều chỉnh.');
      return;
    }

    const quantityAfter = Number(this.createForm.quantity_after);
    if (!Number.isFinite(quantityAfter)) {
      this.toastr.error('Số lượng sau điều chỉnh không hợp lệ.');
      return;
    }

    if (quantityAfter < 0) {
      this.toastr.error('Số lượng sau điều chỉnh phải lớn hơn hoặc bằng 0.');
      return;
    }

    if (!this.hasValidQuantityFormat(quantityAfter)) {
      this.toastr.error('Số lượng sau điều chỉnh chỉ được tối đa 13 chữ số nguyên và 2 chữ số thập phân.');
      return;
    }

    if (quantityAfter < Number(this.selectedInventory.quantity_reserved)) {
      this.toastr.error('Số lượng sau điều chỉnh không được nhỏ hơn số lượng đã giữ chỗ.');
      return;
    }

    const delta = quantityAfter - Number(this.selectedInventory.quantity_on_hand);
    if (delta === 0) {
      this.toastr.error('Số lượng sau điều chỉnh phải khác tồn hiện tại.');
      return;
    }

    const payload: CreateStockAdjustmentRequest = {
      inventory_id: this.selectedInventory.id,
      quantity_after: quantityAfter,
      reason: this.createForm.reason,
      notes: this.normalizeOptionalText(this.createForm.notes)
    };

    this.actionLoading = true;
    this.adjService.create(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success(this.getCreateSuccessMessage(res.data));
          this.closeAllModals();
          this.loadAdjustments();
        }
        this.actionLoading = false;
      },
      error: () => {
        this.actionLoading = false;
      }
    });
  }

  onApproveSubmit(): void {
    if (!this.selectedAdjustment) {
      return;
    }

    const payload: ApproveStockAdjustmentRequest = {};
    const approvalNote = this.normalizeOptionalText(this.approveForm.approval_note);
    if (approvalNote) {
      payload.approval_note = approvalNote;
    }

    this.actionLoading = true;
    this.adjService.approve(this.selectedAdjustment.id, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Phê duyệt phiếu điều chỉnh thành công.');
          this.closeAllModals();
          this.loadAdjustments();
        }
        this.actionLoading = false;
      },
      error: () => {
        this.actionLoading = false;
      }
    });
  }

  onRejectSubmit(): void {
    if (!this.selectedAdjustment) {
      return;
    }

    const rejectionReason = this.normalizeOptionalText(this.rejectForm.rejection_reason);
    if (!rejectionReason) {
      this.toastr.error('Lý do từ chối là bắt buộc.');
      return;
    }

    this.actionLoading = true;
    this.adjService.reject(this.selectedAdjustment.id, { rejection_reason: rejectionReason }).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Từ chối phiếu điều chỉnh thành công.');
          this.closeAllModals();
          this.loadAdjustments();
        }
        this.actionLoading = false;
      },
      error: () => {
        this.actionLoading = false;
      }
    });
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showDetailModal = false;
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.selectedAdjustment = null;
    this.actionLoading = false;
    this.clearInventorySearchDebounce();
  }

  getStatusLabel(status: StockAdjustmentsStatus): string {
    const labels: Record<StockAdjustmentsStatus, string> = {
      [StockAdjustmentsStatus.PENDING_APPROVAL]: 'Chờ duyệt',
      [StockAdjustmentsStatus.APPROVED]: 'Đã duyệt',
      [StockAdjustmentsStatus.REJECTED]: 'Đã từ chối'
    };
    return labels[status];
  }

  getStatusClass(status: StockAdjustmentsStatus): string {
    const classes: Record<StockAdjustmentsStatus, string> = {
      [StockAdjustmentsStatus.PENDING_APPROVAL]: 'badge-pending',
      [StockAdjustmentsStatus.APPROVED]: 'badge-active',
      [StockAdjustmentsStatus.REJECTED]: 'badge-inactive'
    };
    return classes[status];
  }

  getReasonLabel(reason: ReasonType): string {
    const labels: Record<ReasonType, string> = {
      [ReasonType.DAMAGE]: 'Hư hỏng',
      [ReasonType.THEFT]: 'Thất thoát / mất cắp',
      [ReasonType.COUNT_ERROR]: 'Sai lệch kiểm đếm',
      [ReasonType.EXPIRED]: 'Hết hạn',
      [ReasonType.QUALITY_ISSUE]: 'Vấn đề chất lượng',
      [ReasonType.SYSTEM_ERROR]: 'Lỗi hệ thống',
      [ReasonType.OTHER]: 'Khác'
    };
    return labels[reason];
  }

  getProductDisplay(adjustment: StockAdjustmentResponse): string {
    const product = this.productLookup.get(adjustment.product_id);
    if (!product) {
      return adjustment.product_id;
    }
    if (product.sku) {
      return `${product.sku} - ${product.name}`;
    }
    return product.name;
  }

  getLocationDisplay(adjustment: StockAdjustmentResponse): string {
    const location = this.locationLookup.get(adjustment.location_id);
    if (!location) {
      return adjustment.location_id;
    }
    if (location.code) {
      return `${location.code} - ${location.name}`;
    }
    return location.name;
  }

  getWarehouseDisplay(adjustment: StockAdjustmentResponse): string {
    return this.warehouseLookup.get(adjustment.warehouse_id) ?? adjustment.warehouse_id;
  }

  getBatchDisplay(adjustment: StockAdjustmentResponse): string {
    if (!adjustment.batch_id) {
      return 'Không có lô';
    }
    return this.batchLookup.get(adjustment.batch_id) ?? adjustment.batch_id;
  }

  getAdjustmentQuantityClass(quantity: number): string {
    return quantity >= 0 ? 'text-success' : 'text-danger';
  }

  getSignedQuantity(value: number): string {
    return value > 0 ? `+${value}` : `${value}`;
  }

  getInventoryOptionLabel(inventory: InventoryResponse): string {
    const batchLabel = inventory.batch_number ? ` | Lô: ${inventory.batch_number}` : '';
    return `${inventory.product_sku} - ${inventory.product_name} | ${inventory.location_code}${batchLabel}`;
  }

  private initFilters(): StockAdjustmentFilterForm {
    return {
      status: '',
      warehouse_id: '',
      inventory_id: '',
      adjustment_number: '',
      created_from: '',
      created_to: ''
    };
  }

  private initCreateForm(): StockAdjustmentCreateFormState {
    return {
      inventory_id: '',
      quantity_after: null,
      reason: ReasonType.COUNT_ERROR,
      notes: ''
    };
  }

  private buildSearchFilters(): SearchStockAdjustmentsParams | undefined {
    const filters: SearchStockAdjustmentsParams = {};

    if (this.filters.status) {
      filters.status = this.filters.status;
    }
    if (this.filters.warehouse_id.trim()) {
      filters.warehouseId = this.filters.warehouse_id.trim();
    }
    if (this.filters.inventory_id.trim()) {
      filters.inventoryId = this.filters.inventory_id.trim();
    }
    if (this.filters.adjustment_number.trim()) {
      filters.adjustmentNumber = this.filters.adjustment_number.trim();
    }

    const createdFrom = this.normalizeDateTimeLocal(this.filters.created_from);
    const createdTo = this.normalizeDateTimeLocal(this.filters.created_to);
    if (createdFrom) {
      filters.createdFrom = createdFrom;
    }
    if (createdTo) {
      filters.createdTo = createdTo;
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  private applyAdjustmentPage(content: StockAdjustmentResponse[], totalElements: number, totalPages: number): void {
    this.adjustments = content;
    this.totalElements = totalElements;
    this.totalPages = totalPages;
  }

  private loadMockAdjustments(): void {
    this.seedLookupsFromInventories(MOCK_INVENTORIES);
    this.warehouses = MOCK_WAREHOUSES;
    MOCK_WAREHOUSES.forEach((warehouse) => this.warehouseLookup.set(warehouse.id, warehouse.name));

    const page = mockPage(MOCK_STOCK_ADJUSTMENTS, this.currentPage, this.pageSize);
    this.applyAdjustmentPage(page.content, page.total_elements, page.total_pages);
  }

  private fetchAdjustmentDetail(id: string, onLoaded: (adjustment: StockAdjustmentResponse) => void): void {
    this.detailLoading = true;
    this.adjService.getById(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.enrichAdjustmentRelations([res.data]);
          onLoaded(res.data);
        }
        this.detailLoading = false;
      },
      error: () => {
        const fallback = this.adjustments.find((adjustment) => adjustment.id === id);
        if (fallback) {
          onLoaded(fallback);
        } else {
          this.toastr.error('Không tải được chi tiết phiếu điều chỉnh.');
        }
        this.detailLoading = false;
      }
    });
  }

  private searchInventories(): void {
    const keyword = this.inventorySearchKeyword.trim();
    const filters: InventoryFilterRequest = {};
    if (this.createWarehouseId.trim()) {
      filters.warehouse_id = this.createWarehouseId.trim();
    }

    this.inventoryLoading = true;
    const request$ = keyword
      ? this.inventoryService.getAll(0, this.autocompletePageSize, { ...filters, product_name: keyword })
      : this.inventoryService.getAll(0, this.autocompletePageSize, filters);

    request$.subscribe({
      next: (res) => {
        const inventories = res.success ? res.data.content : [];
        if (keyword && inventories.length === 0) {
          this.searchInventoriesBySku(filters, keyword);
          return;
        }
        this.inventoryOptions = inventories;
        this.seedLookupsFromInventories(inventories);
        this.inventoryLoading = false;
      },
      error: () => {
        this.loadMockInventories(filters, keyword);
        this.inventoryLoading = false;
      }
    });
  }

  private searchInventoriesBySku(baseFilters: InventoryFilterRequest, keyword: string): void {
    this.inventoryService.getAll(0, this.autocompletePageSize, { ...baseFilters, product_sku: keyword }).subscribe({
      next: (res) => {
        this.inventoryOptions = res.success ? res.data.content : [];
        this.seedLookupsFromInventories(this.inventoryOptions);
        this.inventoryLoading = false;
      },
      error: () => {
        this.loadMockInventories(baseFilters, keyword);
        this.inventoryLoading = false;
      }
    });
  }

  private loadMockInventories(filters: InventoryFilterRequest, keyword: string): void {
    const normalizedKeyword = keyword.toLowerCase();
    const fallbackInventories = MOCK_INVENTORIES.filter((inventory) => {
      const matchesWarehouse = !filters.warehouse_id || inventory.warehouse_id === filters.warehouse_id;
      const matchesKeyword = !normalizedKeyword
        || inventory.product_name.toLowerCase().includes(normalizedKeyword)
        || inventory.product_sku.toLowerCase().includes(normalizedKeyword)
        || inventory.location_code.toLowerCase().includes(normalizedKeyword)
        || inventory.location_name.toLowerCase().includes(normalizedKeyword)
        || (inventory.batch_number ?? '').toLowerCase().includes(normalizedKeyword);
      return matchesWarehouse && matchesKeyword;
    }).slice(0, this.autocompletePageSize);

    this.inventoryOptions = fallbackInventories;
    this.seedLookupsFromInventories(fallbackInventories);
  }

  private enrichAdjustmentRelations(adjustments: StockAdjustmentResponse[]): void {
    const lookupRequests = [
      ...this.buildProductLookupRequests(adjustments),
      ...this.buildLocationLookupRequests(adjustments),
      ...this.buildWarehouseLookupRequests(adjustments),
      ...this.buildBatchLookupRequests(adjustments)
    ];

    if (lookupRequests.length === 0) {
      return;
    }

    forkJoin(lookupRequests).subscribe((results: LookupResult[]) => {
      results.forEach((result) => {
        switch (result.type) {
          case 'product':
            this.productLookup.set(result.id, { name: result.name, sku: result.secondary });
            break;
          case 'location':
            this.locationLookup.set(result.id, { name: result.name, code: result.secondary });
            break;
          case 'warehouse':
            this.warehouseLookup.set(result.id, result.name);
            break;
          case 'batch':
            this.batchLookup.set(result.id, result.name);
            break;
        }
      });
    });
  }

  private buildProductLookupRequests(adjustments: StockAdjustmentResponse[]) {
    const missingIds = Array.from(new Set(
      adjustments
        .map((adjustment) => adjustment.product_id)
        .filter((id) => !!id && !this.productLookup.has(id))
    ));

    return missingIds.map((id) =>
      this.productService.getById(id).pipe(
        map((res) => ({
          type: 'product' as const,
          id,
          name: res.success ? res.data.name : id,
          secondary: res.success ? res.data.sku : undefined
        })),
        catchError(() => of({ type: 'product' as const, id, name: id }))
      )
    );
  }

  private buildLocationLookupRequests(adjustments: StockAdjustmentResponse[]) {
    const missingIds = Array.from(new Set(
      adjustments
        .map((adjustment) => adjustment.location_id)
        .filter((id) => !!id && !this.locationLookup.has(id))
    ));

    return missingIds.map((id) =>
      this.locationService.getById(id).pipe(
        map((res) => ({
          type: 'location' as const,
          id,
          name: res.success ? res.data.name : id,
          secondary: res.success ? res.data.code : undefined
        })),
        catchError(() => of({ type: 'location' as const, id, name: id }))
      )
    );
  }

  private buildWarehouseLookupRequests(adjustments: StockAdjustmentResponse[]) {
    const missingIds = Array.from(new Set(
      adjustments
        .map((adjustment) => adjustment.warehouse_id)
        .filter((id) => !!id && !this.warehouseLookup.has(id))
    ));

    return missingIds.map((id) =>
      this.warehouseService.getById(id).pipe(
        map((res) => ({
          type: 'warehouse' as const,
          id,
          name: res.success ? res.data.name : id
        })),
        catchError(() => of({ type: 'warehouse' as const, id, name: id }))
      )
    );
  }

  private buildBatchLookupRequests(adjustments: StockAdjustmentResponse[]) {
    const missingIds = Array.from(new Set(
      adjustments
        .map((adjustment) => adjustment.batch_id)
        .filter((id): id is string => !!id && !this.batchLookup.has(id))
    ));

    return missingIds.map((id) =>
      this.batchService.getById(id).pipe(
        map((res) => ({
          type: 'batch' as const,
          id,
          name: res.success ? res.data.batch_number : id
        })),
        catchError(() => of({ type: 'batch' as const, id, name: id }))
      )
    );
  }

  private seedLookupsFromInventories(inventories: InventoryResponse[]): void {
    inventories.forEach((inventory) => {
      this.productLookup.set(inventory.product_id, { name: inventory.product_name, sku: inventory.product_sku });
      this.locationLookup.set(inventory.location_id, { name: inventory.location_name, code: inventory.location_code });
      this.warehouseLookup.set(inventory.warehouse_id, inventory.warehouse_name);
      if (inventory.batch_id && inventory.batch_number) {
        this.batchLookup.set(inventory.batch_id, inventory.batch_number);
      }
    });
  }

  private clearSelectedInventory(): void {
    this.createForm.inventory_id = '';
    this.createForm.quantity_after = null;
    this.selectedInventory = null;
  }

  private clearInventorySearchDebounce(): void {
    if (this.inventorySearchDebounceHandle) {
      clearTimeout(this.inventorySearchDebounceHandle);
      this.inventorySearchDebounceHandle = null;
    }
  }

  private hasInvalidDateRange(): boolean {
    const createdFrom = this.normalizeDateTimeLocal(this.filters.created_from);
    const createdTo = this.normalizeDateTimeLocal(this.filters.created_to);
    return !!createdFrom && !!createdTo && createdFrom > createdTo;
  }

  private normalizeDateTimeLocal(value: string): string | undefined {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return undefined;
    }
    return normalizedValue.length === 16 ? `${normalizedValue}:00` : normalizedValue;
  }

  private normalizeOptionalText(value: string | null | undefined): string | undefined {
    const normalizedValue = value?.trim();
    return normalizedValue ? normalizedValue : undefined;
  }

  private hasValidQuantityFormat(value: number): boolean {
    const [integerPart, decimalPart = ''] = Math.abs(value).toString().split('.');
    return integerPart.length <= 13 && decimalPart.length <= 2;
  }

  private requiresApprovalPreview(reason: ReasonType, delta: number): boolean {
    if (this.roles.includes('ADMIN')) {
      return false;
    }

    const sensitiveReason = reason === ReasonType.THEFT || reason === ReasonType.SYSTEM_ERROR;
    const largeDelta = Math.abs(delta) >= 5;

    if (this.roles.includes('MANAGER')) {
      return sensitiveReason || largeDelta;
    }

    return true;
  }

  private getCreateSuccessMessage(adjustment: StockAdjustmentResponse): string {
    return adjustment.status === StockAdjustmentsStatus.PENDING_APPROVAL || adjustment.requires_approval
      ? 'Tạo phiếu điều chỉnh thành công. Phiếu đang chờ phê duyệt.'
      : 'Tạo phiếu điều chỉnh thành công và tồn kho đã được cập nhật ngay.';
  }
}

@Component({
  selector: 'app-stock-transfers',
  templateUrl: './stock-transfers.component.html',
  styleUrls: ['./stock-transfers.component.css']
})
export class StockTransfersComponent implements OnInit {
  transfers: StockTransferResponse[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';

  showCreateModal = false;
  createForm: CreateStockTransferRequest = this.initCreateForm();

  products: ProductResponse[] = [];
  locations: LocationResponse[] = [];

  constructor(
    private transferService: StockTransferService,
    private productService: ProductService,
    private locationService: LocationService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadTransfers();
    this.loadDropdowns();
  }

  loadDropdowns(): void {
    this.productService.getAll(0, 200).subscribe({
      next: (res) => { if (res.success) this.products = res.data.content; }
    });
    this.locationService.getAll(0, 200).subscribe({
      next: (res) => { if (res.success) this.locations = res.data.content; }
    });
  }

  loadTransfers(): void {
    this.loading = true;
    this.transferService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.transfers = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        const page = mockPage(MOCK_STOCK_TRANSFERS, this.currentPage, this.pageSize);
        this.transfers = page.content;
        this.totalElements = page.total_elements;
        this.totalPages = page.total_pages;
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadTransfers();
  }

  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    this.transferService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo phiếu chuyển kho thành công!');
          this.showCreateModal = false;
          this.loadTransfers();
        }
      }
    });
  }

  closeAllModals(): void {
    this.showCreateModal = false;
  }

  private initCreateForm(): CreateStockTransferRequest {
    return { product_id: '', from_location_id: '', to_location_id: '', quantity: 0 };
  }
}
