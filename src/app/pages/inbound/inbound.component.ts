import { Component, OnInit } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import {
  InboundReceiptLineResponse,
  InboundReceiptResponse
} from '../../dto/response/InboundReceipt/InboundReceiptResponse';
import {
  InboundReceiptFilters,
  InboundService
} from '../../service/InboundService/inbound.service';
import { BusinessPartnerService } from '../../service/BusinessPartnerService/business-partner.service';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';
import { PurchaseOrderService } from '../../service/PurchaseOrderService/purchase-order.service';
import { PurchaseOrderLineService } from '../../service/PurchaseOrderLineService/purchase-order-line.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { InboundReceiptStatus } from '../../helper/enums/InboundReceiptStatus';
import { OrderStatus } from '../../helper/enums/OrderStatus';
import { BusinessPartnerType } from '../../helper/enums/BusinessPartnerType';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import {
  CreateInboundReceiptRequest,
  UpdateInboundReceiptRequest
} from '../../dto/request/InboundReceipt/InboundReceiptRequest';
import { PurchaseOrderResponse } from '../../dto/response/PurchaseOrder/PurchaseOrderResponse';
import { PurchaseOrderLineResponse } from '../../dto/response/PurchaseOrderLine/PurchaseOrderLineResponse';
import { ProductService } from '../../service/ProductService/product.service';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { LocationService } from '../../service/Location/location.service';
import { LocationResponse } from '../../dto/response/Location/LocationResponse';
import { BatchService } from '../../service/BatchService/batch.service';
import { BatchResponse } from '../../dto/response/Batch/BatchResponse';
import { InboundReceiptLineService } from '../../service/InboundReceiptLineService/inbound-receipt-line.service';
import {
  CreateInboundReceiptLineRequest,
  UpdateInboundReceiptLineRequest
} from '../../dto/request/InboundReceiptLine/InboundReceiptLineRequest';
import { QualityStatus } from '../../helper/enums/QualityStatus';
import { LocationStatus } from '../../helper/enums/LocationStatus';
import { BatchStatus } from '../../helper/enums/BatchStatus';

interface InboundReceiptLineFormState {
  inbound_receipt_id: string;
  purchase_order_line_id: string;
  location_id: string;
  batch_id: string;
  quantity_received: number | null;
  quality_status: QualityStatus;
  notes: string;
}

@Component({
  selector: 'app-inbound',
  templateUrl: './inbound.component.html',
  styleUrls: ['./inbound.component.css']
})
export class InboundComponent implements OnInit {
  receipts: InboundReceiptResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  suppliers: BusinessPartnerResponse[] = [];
  products: ProductResponse[] = [];
  receiptLocations: LocationResponse[] = [];
  batchCatalog: BatchResponse[] = [];
  availablePurchaseOrders: PurchaseOrderResponse[] = [];
  detailPurchaseOrder: PurchaseOrderResponse | null = null;
  detailPurchaseOrderLines: PurchaseOrderLineResponse[] = [];
  createPurchaseOrder: PurchaseOrderResponse | null = null;
  createPurchaseOrderReceipts: InboundReceiptResponse[] = [];

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  detailLoading = false;
  referenceLoading = false;
  loadingAvailablePurchaseOrders = false;
  loadingCreatePurchaseOrderReceipts = false;
  loadingDetailPurchaseOrder = false;
  loadingProductCatalog = false;
  loadingLineReferences = false;
  lineSubmitting = false;
  viewMode: 'grid' | 'list' = 'list';
  detailTab: 'header' | 'lines' = 'header';

  searchReceiptNumber = '';
  selectedStatus: '' | InboundReceiptStatus = '';
  selectedWarehouseId = '';
  receiptDateFrom = '';
  receiptDateTo = '';

  showCreateModal = false;
  showDetailModal = false;
  showEditModal = false;
  showDeleteConfirm = false;
  showConfirmConfirm = false;
  showLineEditorModal = false;
  showDeleteLineConfirm = false;

  selectedReceipt: InboundReceiptResponse | null = null;
  receiptToDelete: InboundReceiptResponse | null = null;
  receiptToConfirm: InboundReceiptResponse | null = null;
  selectedLine: InboundReceiptLineResponse | null = null;
  lineToDelete: InboundReceiptLineResponse | null = null;
  lineEditorMode: 'create' | 'edit' = 'create';

  createForm: CreateInboundReceiptRequest = this.initCreateForm();
  editForm: UpdateInboundReceiptRequest = {};
  lineForm: InboundReceiptLineFormState = this.initLineForm();

  InboundReceiptStatus = InboundReceiptStatus;
  OrderStatus = OrderStatus;
  QualityStatus = QualityStatus;
  LocationStatus = LocationStatus;
  BatchStatus = BatchStatus;

  constructor(
    private inboundService: InboundService,
    private inboundReceiptLineService: InboundReceiptLineService,
    private purchaseOrderService: PurchaseOrderService,
    private purchaseOrderLineService: PurchaseOrderLineService,
    private productService: ProductService,
    private locationService: LocationService,
    private batchService: BatchService,
    private businessPartnerService: BusinessPartnerService,
    private warehouseService: WarehouseService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadReceipts();
    this.loadReferences();
    this.loadProductCatalog();
  }

  loadReceipts(): void {
    this.loading = true;
    const filters: InboundReceiptFilters = {
      receiptNumber: this.searchReceiptNumber.trim() || undefined,
      warehouseId: this.selectedWarehouseId || undefined,
      status: this.selectedStatus || undefined,
      receiptDateFrom: this.receiptDateFrom || undefined,
      receiptDateTo: this.receiptDateTo || undefined,
      sortBy: 'updatedAt',
      direction: 'DESC'
    };

    this.inboundService.getAll(this.currentPage, this.pageSize, filters).subscribe({
      next: (res) => {
        if (res.success) {
          this.receipts = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: (error) => {
        this.receipts = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
        this.toastr.error(error?.error?.message || 'Không tải được danh sách phiếu nhập.');
      }
    });
  }

  loadReferences(): void {
    this.referenceLoading = true;

    forkJoin({
      suppliers: this.businessPartnerService.getAll(),
      warehouses: this.warehouseService.getList()
    }).subscribe({
      next: ({ suppliers, warehouses }) => {
        if (suppliers.success) {
          this.suppliers = suppliers.data.filter((partner) =>
            partner.status === 'ACTIVE'
            && (partner.type === BusinessPartnerType.SUPPLIER || partner.type === BusinessPartnerType.BOTH)
          );
        }

        if (warehouses.success) {
          this.warehouses = warehouses.data;
        }

        this.availablePurchaseOrders = this.availablePurchaseOrders.map((order) => this.enrichPurchaseOrder(order));
        this.createPurchaseOrder = this.createPurchaseOrder ? this.enrichPurchaseOrder(this.createPurchaseOrder) : null;
        this.detailPurchaseOrder = this.detailPurchaseOrder ? this.enrichPurchaseOrder(this.detailPurchaseOrder) : null;
        this.referenceLoading = false;
      },
      error: () => {
        this.referenceLoading = false;
        this.suppliers = [];
        this.warehouses = [];
        this.toastr.error('Không tải được dữ liệu tham chiếu cho màn nhập kho.');
      }
    });
  }

  loadProductCatalog(): void {
    this.loadingProductCatalog = true;

    this.fetchAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.detailPurchaseOrderLines = this.detailPurchaseOrderLines.map((line) => this.enrichPurchaseOrderLine(line));
        this.loadingProductCatalog = false;
      },
      error: (error) => {
        this.products = [];
        this.loadingProductCatalog = false;
        this.toastr.error(error?.error?.message || 'Không tải được danh mục sản phẩm.');
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadReceipts();
  }

  onResetFilter(): void {
    this.searchReceiptNumber = '';
    this.selectedStatus = '';
    this.selectedWarehouseId = '';
    this.receiptDateFrom = '';
    this.receiptDateTo = '';
    this.currentPage = 0;
    this.loadReceipts();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.loadReceipts();
  }

  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.createPurchaseOrder = null;
    this.createPurchaseOrderReceipts = [];
    this.showCreateModal = true;
    this.loadAvailablePurchaseOrders();
  }

  onCreateSubmit(): void {
    if (!this.createForm.purchase_order_id) {
      this.toastr.warning('Vui lòng chọn đơn mua hàng để tạo phiếu nhập.');
      return;
    }

    this.inboundService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo phiếu nhập thành công.');
          this.showCreateModal = false;
          this.loadReceipts();
          this.openDetailModal(res.data);
          this.detailTab = 'lines';
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Tạo phiếu nhập thất bại.');
      }
    });
  }

  openDetailModal(receipt: InboundReceiptResponse): void {
    this.selectedReceipt = null;
    this.detailPurchaseOrder = null;
    this.detailPurchaseOrderLines = [];
    this.detailTab = 'header';
    this.showDetailModal = true;
    this.closeLineMutations();
    this.loadReceiptDetail(receipt.id);
  }

  loadReceiptDetail(receiptId: string): void {
    this.detailLoading = true;

    this.inboundService.getById(receiptId).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedReceipt = res.data;
          this.loadDetailPurchaseOrderContext(res.data.purchase_order_id);

          if (res.data.status === InboundReceiptStatus.DRAFT) {
            this.loadLineReferences(res.data);
          } else {
            this.resetLineReferences();
          }
        }
        this.detailLoading = false;
      },
      error: (error) => {
        this.detailLoading = false;
        this.showDetailModal = false;
        this.selectedReceipt = null;
        this.toastr.error(error?.error?.message || 'Không tải được chi tiết phiếu nhập.');
        this.loadReceipts();
      }
    });
  }

  loadDetailPurchaseOrderContext(purchaseOrderId: string): void {
    this.loadingDetailPurchaseOrder = true;

    forkJoin({
      purchaseOrder: this.purchaseOrderService.getById(purchaseOrderId),
      purchaseOrderLines: this.purchaseOrderLineService.getByPurchaseOrderId(purchaseOrderId)
    }).subscribe({
      next: ({ purchaseOrder, purchaseOrderLines }) => {
        this.detailPurchaseOrder = purchaseOrder.success ? this.enrichPurchaseOrder(purchaseOrder.data) : null;
        this.detailPurchaseOrderLines = purchaseOrderLines.success
          ? purchaseOrderLines.data.map((line) => this.enrichPurchaseOrderLine(line))
          : [];
        this.loadingDetailPurchaseOrder = false;
        this.syncLineFormForCurrentSelection();
      },
      error: () => {
        this.detailPurchaseOrder = null;
        this.detailPurchaseOrderLines = [];
        this.loadingDetailPurchaseOrder = false;
      }
    });
  }

  openDeleteConfirm(receipt: InboundReceiptResponse): void {
    this.receiptToDelete = receipt;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.receiptToDelete) {
      return;
    }

    this.inboundService.delete(this.receiptToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xóa phiếu nhập thành công.');
          const deletedId = this.receiptToDelete?.id;
          this.showDeleteConfirm = false;
          this.receiptToDelete = null;
          if (this.selectedReceipt?.id === deletedId) {
            this.closeDetailModal();
          } else {
            this.loadReceipts();
          }
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Xóa phiếu nhập thất bại.');
        this.showDeleteConfirm = false;
        this.receiptToDelete = null;
        this.refreshSelectedReceiptIfOpen();
      }
    });
  }

  openEditModal(): void {
    if (!this.selectedReceipt || !this.canEditReceipt(this.selectedReceipt)) {
      return;
    }

    this.editForm = {
      receipt_date: this.selectedReceipt.receipt_date,
      delivery_note_number: this.selectedReceipt.delivery_note_number || undefined,
      notes: this.selectedReceipt.notes || undefined
    };
    this.showEditModal = true;
  }

  onEditSubmit(): void {
    if (!this.selectedReceipt) {
      return;
    }

    this.inboundService.update(this.selectedReceipt.id, this.editForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Cập nhật phiếu nhập thành công.');
          this.showEditModal = false;
          this.selectedReceipt = res.data;
          this.loadReceipts();
          this.loadDetailPurchaseOrderContext(res.data.purchase_order_id);
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Cập nhật phiếu nhập thất bại.');
        this.showEditModal = false;
        this.refreshSelectedReceiptIfOpen();
      }
    });
  }

  openConfirmConfirm(receipt: InboundReceiptResponse): void {
    this.receiptToConfirm = receipt;
    this.showConfirmConfirm = true;
  }

  onConfirmReceipt(): void {
    if (!this.receiptToConfirm) {
      return;
    }

    const receiptId = this.receiptToConfirm.id;
    this.inboundService.confirm(receiptId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xác nhận phiếu nhập thành công.');
          this.showConfirmConfirm = false;
          this.receiptToConfirm = null;
          this.selectedReceipt = res.data;
          this.loadReceipts();
          this.loadDetailPurchaseOrderContext(res.data.purchase_order_id);
          this.resetLineReferences();
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Xác nhận phiếu nhập thất bại.');
        this.showConfirmConfirm = false;
        this.receiptToConfirm = null;
        this.refreshSelectedReceiptIfOpen(receiptId);
      }
    });
  }

  openLineEditor(mode: 'create' | 'edit', line?: InboundReceiptLineResponse): void {
    if (!this.selectedReceipt || !this.canEditReceipt(this.selectedReceipt)) {
      return;
    }

    if (this.loadingDetailPurchaseOrder) {
      this.toastr.warning('Đang tải thông tin dòng đơn mua hàng. Vui lòng thử lại sau.');
      return;
    }

    if (mode === 'create' && this.getCreateAvailablePurchaseOrderLines().length === 0) {
      this.toastr.warning('Không còn dòng đơn mua hàng nào có thể nhận thêm trên phiếu nhập này.');
      return;
    }

    this.lineEditorMode = mode;
    this.selectedLine = line || null;
    this.lineForm = mode === 'edit' && line
      ? this.initLineFormFromLine(line)
      : this.initLineForm(
          this.selectedReceipt.id,
          this.getCreateAvailablePurchaseOrderLines()[0]?.id || ''
        );

    this.showLineEditorModal = true;
    this.loadLineReferences(this.selectedReceipt);
    this.syncLineFormForCurrentSelection();
  }

  onLinePurchaseOrderChange(purchaseOrderLineId: string): void {
    this.lineForm.purchase_order_line_id = purchaseOrderLineId;
    this.syncLineFormForCurrentSelection();
  }

  onLineQualityStatusChange(status: QualityStatus): void {
    this.lineForm.quality_status = status;
    this.syncLineFormForCurrentSelection();
  }

  onLineSubmit(): void {
    if (!this.selectedReceipt || !this.validateLineForm()) {
      return;
    }

    this.lineSubmitting = true;

    if (this.lineEditorMode === 'create') {
      const request = this.buildCreateLineRequest();
      this.inboundReceiptLineService.create(request).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('Thêm dòng phiếu nhập thành công.');
            this.closeSubModal('lineEditor');
            this.refreshSelectedReceiptIfOpen(this.selectedReceipt!.id);
          }
          this.lineSubmitting = false;
        },
        error: (error) => {
          this.lineSubmitting = false;
          this.toastr.error(error?.error?.message || 'Thêm dòng phiếu nhập thất bại.');
        }
      });
      return;
    }

    if (!this.selectedLine) {
      this.lineSubmitting = false;
      return;
    }

    const request = this.buildUpdateLineRequest();
    this.inboundReceiptLineService.update(this.selectedLine.id, request).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Cập nhật dòng phiếu nhập thành công.');
          this.closeSubModal('lineEditor');
          this.refreshSelectedReceiptIfOpen(this.selectedReceipt!.id);
        }
        this.lineSubmitting = false;
      },
      error: (error) => {
        this.lineSubmitting = false;
        this.toastr.error(error?.error?.message || 'Cập nhật dòng phiếu nhập thất bại.');
      }
    });
  }

  openDeleteLineConfirm(line: InboundReceiptLineResponse): void {
    if (!this.selectedReceipt || !this.canEditReceipt(this.selectedReceipt)) {
      return;
    }

    this.lineToDelete = line;
    this.showDeleteLineConfirm = true;
  }

  onDeleteLineConfirm(): void {
    if (!this.lineToDelete || !this.selectedReceipt) {
      return;
    }

    const receiptId = this.selectedReceipt.id;
    this.inboundReceiptLineService.delete(this.lineToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xóa dòng phiếu nhập thành công.');
          this.showDeleteLineConfirm = false;
          this.lineToDelete = null;
          this.refreshSelectedReceiptIfOpen(receiptId);
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Xóa dòng phiếu nhập thất bại.');
      }
    });
  }

  onCreatePurchaseOrderChange(purchaseOrderId: string): void {
    this.createPurchaseOrder = this.enrichPurchaseOrderById(purchaseOrderId);
    this.createPurchaseOrderReceipts = [];

    if (!purchaseOrderId) {
      return;
    }

    this.loadingCreatePurchaseOrderReceipts = true;
    this.inboundService.getByPurchaseOrderId(purchaseOrderId).subscribe({
      next: (res) => {
        this.createPurchaseOrderReceipts = res.success ? res.data : [];
        this.loadingCreatePurchaseOrderReceipts = false;
      },
      error: () => {
        this.createPurchaseOrderReceipts = [];
        this.loadingCreatePurchaseOrderReceipts = false;
      }
    });
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createForm = this.initCreateForm();
    this.createPurchaseOrder = null;
    this.createPurchaseOrderReceipts = [];
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedReceipt = null;
    this.detailPurchaseOrder = null;
    this.detailPurchaseOrderLines = [];
    this.detailTab = 'header';
    this.showEditModal = false;
    this.showDeleteConfirm = false;
    this.showConfirmConfirm = false;
    this.receiptToDelete = null;
    this.receiptToConfirm = null;
    this.closeLineMutations();
    this.resetLineReferences();
    this.loadReceipts();
  }

  closeSubModal(modal: 'edit' | 'delete' | 'confirm' | 'lineEditor' | 'deleteLine'): void {
    if (modal === 'edit') {
      this.showEditModal = false;
      return;
    }

    if (modal === 'delete') {
      this.showDeleteConfirm = false;
      this.receiptToDelete = null;
      return;
    }

    if (modal === 'confirm') {
      this.showConfirmConfirm = false;
      this.receiptToConfirm = null;
      return;
    }

    if (modal === 'lineEditor') {
      this.showLineEditorModal = false;
      this.selectedLine = null;
      this.lineSubmitting = false;
      if (this.selectedReceipt) {
        this.lineForm = this.initLineForm(this.selectedReceipt.id);
      } else {
        this.lineForm = this.initLineForm();
      }
      return;
    }

    this.showDeleteLineConfirm = false;
    this.lineToDelete = null;
  }

  canEditReceipt(receipt: InboundReceiptResponse): boolean {
    return receipt.status === InboundReceiptStatus.DRAFT;
  }

  canDeleteReceipt(receipt: InboundReceiptResponse): boolean {
    return receipt.status === InboundReceiptStatus.DRAFT;
  }

  canConfirmReceipt(receipt: InboundReceiptResponse): boolean {
    return receipt.status === InboundReceiptStatus.DRAFT && receipt.lines.length > 0;
  }

  canAddLine(): boolean {
    return !!this.selectedReceipt
      && this.canEditReceipt(this.selectedReceipt)
      && !this.loadingDetailPurchaseOrder
      && this.getCreateAvailablePurchaseOrderLines().length > 0;
  }

  isLineEditorBusy(): boolean {
    return this.loadingLineReferences || this.loadingDetailPurchaseOrder || this.loadingProductCatalog;
  }

  getLineEditorTitle(): string {
    return this.lineEditorMode === 'create' ? 'Thêm dòng phiếu nhập' : 'Sửa dòng phiếu nhập';
  }

  getLineSubmitLabel(): string {
    if (this.lineSubmitting) {
      return this.lineEditorMode === 'create' ? 'Đang thêm...' : 'Đang lưu...';
    }

    return this.lineEditorMode === 'create' ? 'Thêm dòng' : 'Lưu thay đổi';
  }

  getStatusLabel(status: InboundReceiptStatus): string {
    const labels: Record<InboundReceiptStatus, string> = {
      [InboundReceiptStatus.DRAFT]: 'Nháp',
      [InboundReceiptStatus.CONFIRMED]: 'Đã xác nhận',
      [InboundReceiptStatus.CANCELLED]: 'Đã hủy'
    };
    return labels[status];
  }

  getStatusClass(status: InboundReceiptStatus): string {
    const classes: Record<InboundReceiptStatus, string> = {
      [InboundReceiptStatus.DRAFT]: 'badge-draft',
      [InboundReceiptStatus.CONFIRMED]: 'badge-confirmed',
      [InboundReceiptStatus.CANCELLED]: 'badge-cancelled'
    };
    return classes[status];
  }

  getOrderStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.DRAFT]: 'Nháp',
      [OrderStatus.CONFIRMED]: 'Đã xác nhận',
      [OrderStatus.PARTIALLY_RECEIVED]: 'Nhận một phần',
      [OrderStatus.IN_PROGRESS]: 'Đang xử lý',
      [OrderStatus.COMPLETED]: 'Hoàn thành',
      [OrderStatus.CANCELLED]: 'Đã hủy'
    };
    return labels[status];
  }

  getOrderStatusClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      [OrderStatus.DRAFT]: 'badge-draft',
      [OrderStatus.CONFIRMED]: 'badge-confirmed',
      [OrderStatus.PARTIALLY_RECEIVED]: 'badge-progress',
      [OrderStatus.IN_PROGRESS]: 'badge-progress',
      [OrderStatus.COMPLETED]: 'badge-completed',
      [OrderStatus.CANCELLED]: 'badge-cancelled'
    };
    return classes[status];
  }

  getQualityStatusLabel(status: QualityStatus): string {
    if (status === QualityStatus.PASS) {
      return 'Đạt';
    }
    if (status === QualityStatus.QUARANTINE) {
      return 'Cách ly';
    }
    return status;
  }

  getQualityStatusClass(status: QualityStatus): string {
    return status === QualityStatus.QUARANTINE ? 'badge-quarantine' : 'badge-pass';
  }

  getDraftCount(): number {
    return this.receipts.filter((receipt) => receipt.status === InboundReceiptStatus.DRAFT).length;
  }

  getConfirmedCount(): number {
    return this.receipts.filter((receipt) => receipt.status === InboundReceiptStatus.CONFIRMED).length;
  }

  getCancelledCount(): number {
    return this.receipts.filter((receipt) => receipt.status === InboundReceiptStatus.CANCELLED).length;
  }

  getPurchaseOrderLine(lineId: string): PurchaseOrderLineResponse | undefined {
    return this.detailPurchaseOrderLines.find((line) => line.id === lineId);
  }

  getReceiptLineRemaining(line: InboundReceiptLineResponse): number | null {
    const purchaseOrderLine = this.getPurchaseOrderLine(line.purchase_order_line_id);
    if (!purchaseOrderLine) {
      return null;
    }

    return Math.max(0, Number(purchaseOrderLine.quantity_ordered) - Number(purchaseOrderLine.quantity_received));
  }

  getRemainingAfterThisReceipt(line: InboundReceiptLineResponse): number | null {
    const purchaseOrderLine = this.getPurchaseOrderLine(line.purchase_order_line_id);
    if (!purchaseOrderLine) {
      return null;
    }

    return Number(purchaseOrderLine.quantity_ordered)
      - Number(purchaseOrderLine.quantity_received)
      - Number(line.quantity_received);
  }

  getLineEditorSelectedPurchaseOrderLine(): PurchaseOrderLineResponse | undefined {
    return this.getPurchaseOrderLine(this.lineForm.purchase_order_line_id);
  }

  getLineEditorSelectedProduct(): ProductResponse | undefined {
    const purchaseOrderLine = this.getLineEditorSelectedPurchaseOrderLine();
    if (!purchaseOrderLine) {
      return undefined;
    }

    return this.products.find((product) => product.id === purchaseOrderLine.product_id);
  }

  lineEditorRequiresBatchTracking(): boolean {
    return Boolean(this.getLineEditorSelectedProduct()?.requires_batch_tracking);
  }

  getSelectablePurchaseOrderLines(): PurchaseOrderLineResponse[] {
    if (this.lineEditorMode === 'edit' && this.selectedLine) {
      const currentLine = this.getPurchaseOrderLine(this.selectedLine.purchase_order_line_id);
      return currentLine ? [currentLine] : [];
    }

    return this.getCreateAvailablePurchaseOrderLines();
  }

  getPurchaseOrderLineOptionLabel(line: PurchaseOrderLineResponse): string {
    const productLabel = line.product_sku && line.product_name
      ? `${line.product_sku} - ${line.product_name}`
      : (line.product_name || line.product_id);
    const remaining = this.getRemainingCapacityForPurchaseOrderLine(line.id);

    return `Line ${line.line_number} - ${productLabel} - Còn có thể nhận ${remaining.toFixed(2)}`;
  }

  getAvailableLineLocations(): LocationResponse[] {
    return this.receiptLocations
      .filter((location) => location.status !== LocationStatus.INACTIVE && location.status !== LocationStatus.MAINTENANCE)
      .sort((left, right) => `${left.code} ${left.name}`.localeCompare(`${right.code} ${right.name}`));
  }

  getAvailableLineBatches(): BatchResponse[] {
    const product = this.getLineEditorSelectedProduct();
    if (!product || !product.requires_batch_tracking) {
      return [];
    }

    let compatibleBatches = this.batchCatalog.filter((batch) =>
      batch.product_id === product.id
      && batch.status !== BatchStatus.EXPIRED
      && batch.status !== BatchStatus.RECALLED
    );

    if (this.lineForm.quality_status === QualityStatus.PASS) {
      compatibleBatches = compatibleBatches.filter((batch) => batch.status === BatchStatus.AVAILABLE);
    } else {
      compatibleBatches = compatibleBatches.filter((batch) =>
        batch.status === BatchStatus.AVAILABLE || batch.status === BatchStatus.QUARANTINE
      );
    }

    if (this.lineForm.batch_id) {
      const currentBatch = this.batchCatalog.find((batch) => batch.id === this.lineForm.batch_id);
      if (currentBatch && !compatibleBatches.some((batch) => batch.id === currentBatch.id)) {
        compatibleBatches = [currentBatch, ...compatibleBatches];
      }
    }

    return compatibleBatches.sort((left, right) => left.batch_number.localeCompare(right.batch_number));
  }

  getCurrentLineRemainingCapacity(): number | null {
    if (!this.lineForm.purchase_order_line_id) {
      return null;
    }

    return this.getRemainingCapacityForPurchaseOrderLine(
      this.lineForm.purchase_order_line_id,
      this.lineEditorMode === 'edit' ? this.selectedLine?.id : undefined
    );
  }

  getCurrentLineDraftAllocated(): number | null {
    if (!this.lineForm.purchase_order_line_id) {
      return null;
    }

    return this.getDraftAllocatedForPurchaseOrderLine(
      this.lineForm.purchase_order_line_id,
      this.lineEditorMode === 'edit' ? this.selectedLine?.id : undefined
    );
  }

  private loadAvailablePurchaseOrders(): void {
    this.loadingAvailablePurchaseOrders = true;

    forkJoin({
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
    }).subscribe({
      next: ({ confirmed, partiallyReceived }) => {
        const mergedMap = new Map<string, PurchaseOrderResponse>();

        for (const order of confirmed.success ? confirmed.data.content : []) {
          mergedMap.set(order.id, this.enrichPurchaseOrder(order));
        }

        for (const order of partiallyReceived.success ? partiallyReceived.data.content : []) {
          mergedMap.set(order.id, this.enrichPurchaseOrder(order));
        }

        this.availablePurchaseOrders = Array.from(mergedMap.values()).sort(
          (left, right) => right.updated_at.localeCompare(left.updated_at)
        );
        this.loadingAvailablePurchaseOrders = false;
      },
      error: (error) => {
        this.availablePurchaseOrders = [];
        this.loadingAvailablePurchaseOrders = false;
        this.toastr.error(error?.error?.message || 'Không tải được danh sách đơn mua hàng hợp lệ.');
      }
    });
  }

  private loadLineReferences(receipt: InboundReceiptResponse): void {
    this.loadingLineReferences = true;

    forkJoin({
      locations: this.fetchAllLocationsByWarehouse(receipt.warehouse_id).pipe(catchError(() => of([]))),
      batches: this.fetchAllBatches().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ locations, batches }) => {
        this.receiptLocations = locations;
        this.batchCatalog = batches;
        this.loadingLineReferences = false;
        this.syncLineFormForCurrentSelection();
      },
      error: () => {
        this.loadingLineReferences = false;
        this.receiptLocations = [];
        this.batchCatalog = [];
        this.toastr.error('Không tải được dữ liệu vị trí/lô cho màn sửa dòng phiếu nhập.');
      }
    });
  }

  private fetchAllProducts(): Observable<ProductResponse[]> {
    const pageSize = 100;

    return this.productService.getAll(0, pageSize).pipe(
      switchMap((response) => {
        if (!response.success) {
          return of([]);
        }

        const firstPage = response.data.content || [];
        if (response.data.total_pages <= 1) {
          return of(firstPage);
        }

        const remainingRequests = Array.from({ length: response.data.total_pages - 1 }, (_, index) =>
          this.productService.getAll(index + 1, pageSize).pipe(
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

  private fetchAllBatches(): Observable<BatchResponse[]> {
    const pageSize = 100;

    return this.batchService.getAll(0, pageSize).pipe(
      switchMap((response) => {
        if (!response.success) {
          return of([]);
        }

        const firstPage = response.data.content || [];
        if (response.data.total_pages <= 1) {
          return of(firstPage);
        }

        const remainingRequests = Array.from({ length: response.data.total_pages - 1 }, (_, index) =>
          this.batchService.getAll(index + 1, pageSize).pipe(
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

  private fetchAllLocationsByWarehouse(warehouseId: string): Observable<LocationResponse[]> {
    const pageSize = 100;

    return this.locationService.getByWarehouse(warehouseId, 0, pageSize).pipe(
      switchMap((response) => {
        if (!response.success) {
          return of([]);
        }

        const firstPage = response.data.content || [];
        if (response.data.total_pages <= 1) {
          return of(firstPage);
        }

        const remainingRequests = Array.from({ length: response.data.total_pages - 1 }, (_, index) =>
          this.locationService.getByWarehouse(warehouseId, index + 1, pageSize).pipe(
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

  private initCreateForm(): CreateInboundReceiptRequest {
    return {
      purchase_order_id: '',
      receipt_date: new Date().toISOString().slice(0, 10)
    };
  }

  private initLineForm(receiptId = '', purchaseOrderLineId = ''): InboundReceiptLineFormState {
    return {
      inbound_receipt_id: receiptId,
      purchase_order_line_id: purchaseOrderLineId,
      location_id: '',
      batch_id: '',
      quantity_received: null,
      quality_status: QualityStatus.PASS,
      notes: ''
    };
  }

  private initLineFormFromLine(line: InboundReceiptLineResponse): InboundReceiptLineFormState {
    return {
      inbound_receipt_id: line.inbound_receipt_id,
      purchase_order_line_id: line.purchase_order_line_id,
      location_id: line.location_id,
      batch_id: line.batch_id || '',
      quantity_received: Number(line.quantity_received),
      quality_status: line.quality_status || QualityStatus.PASS,
      notes: line.notes || ''
    };
  }

  private buildCreateLineRequest(): CreateInboundReceiptLineRequest {
    return {
      inbound_receipt_id: this.lineForm.inbound_receipt_id,
      purchase_order_line_id: this.lineForm.purchase_order_line_id,
      location_id: this.lineForm.location_id,
      batch_id: this.normalizeOptionalId(this.lineForm.batch_id) || undefined,
      quantity_received: this.lineForm.quantity_received,
      quality_status: this.lineForm.quality_status,
      notes: this.normalizeOptionalText(this.lineForm.notes) || undefined
    };
  }

  private buildUpdateLineRequest(): UpdateInboundReceiptLineRequest {
    return {
      location_id: this.lineForm.location_id,
      batch_id: this.normalizeOptionalId(this.lineForm.batch_id) || undefined,
      quantity_received: this.lineForm.quantity_received,
      quality_status: this.lineForm.quality_status,
      notes: this.normalizeOptionalText(this.lineForm.notes) || undefined
    };
  }

  private validateLineForm(): boolean {
    if (!this.selectedReceipt || !this.canEditReceipt(this.selectedReceipt)) {
      this.toastr.warning('Phiếu nhập không còn ở trạng thái cho phép sửa dòng.');
      return false;
    }

    if (this.isLineEditorBusy()) {
      this.toastr.warning('Dữ liệu tham chiếu của dòng phiếu nhập vẫn đang tải. Vui lòng thử lại sau.');
      return false;
    }

    const purchaseOrderLine = this.getLineEditorSelectedPurchaseOrderLine();
    if (!purchaseOrderLine) {
      this.toastr.warning('Vui lòng chọn dòng đơn mua hàng.');
      return false;
    }

    const product = this.getLineEditorSelectedProduct();
    if (!product) {
      this.toastr.warning('Không xác định được sản phẩm của dòng đơn mua hàng.');
      return false;
    }

    const location = this.getAvailableLineLocations().find((item) => item.id === this.lineForm.location_id);
    if (!location) {
      this.toastr.warning('Vui lòng chọn vị trí hợp lệ trong kho nhận.');
      return false;
    }

    const quantityReceived = Number(this.lineForm.quantity_received);
    if (!Number.isFinite(quantityReceived) || quantityReceived <= 0) {
      this.toastr.warning('Số lượng nhận phải lớn hơn 0.');
      return false;
    }

    const remaining = this.getCurrentLineRemainingCapacity();
    if (remaining === null) {
      this.toastr.warning('Không xác định được số lượng còn có thể nhận.');
      return false;
    }

    if (quantityReceived > remaining) {
      this.toastr.warning(`Số lượng nhận vượt phần còn lại có thể phân bổ của dòng đơn mua hàng (${remaining.toFixed(2)}).`);
      return false;
    }

    const notes = this.normalizeOptionalText(this.lineForm.notes);
    if ((notes || '').length > 500) {
      this.toastr.warning('Ghi chú dòng phiếu nhập không được vượt quá 500 ký tự.');
      return false;
    }

    if (this.lineForm.quality_status === QualityStatus.QUARANTINE && !notes) {
      this.toastr.warning('Dòng nhận hàng bị cách ly bắt buộc phải có ghi chú.');
      return false;
    }

    const normalizedBatchId = this.normalizeOptionalId(this.lineForm.batch_id);
    if (product.requires_batch_tracking) {
      if (!normalizedBatchId) {
        this.toastr.warning('Sản phẩm này bắt buộc phải chọn lô.');
        return false;
      }

      const compatibleBatch = this.getAvailableLineBatches().find((batch) => batch.id === normalizedBatchId);
      if (!compatibleBatch) {
        this.toastr.warning('Lô đã chọn không còn phù hợp với sản phẩm hoặc trạng thái chất lượng hiện tại.');
        return false;
      }
    } else if (normalizedBatchId) {
      this.toastr.warning('Sản phẩm này không theo dõi lô, vui lòng bỏ chọn batch.');
      return false;
    }

    if (this.hasDuplicateSplitDimension(
      this.lineForm.purchase_order_line_id,
      this.lineForm.location_id,
      normalizedBatchId,
      this.lineForm.quality_status,
      this.lineEditorMode === 'edit' ? this.selectedLine?.id : undefined
    )) {
      this.toastr.warning('Đã tồn tại một dòng khác cùng tổ hợp vị trí, batch và trạng thái chất lượng. Hãy sửa dòng hiện có thay vì tạo trùng.');
      return false;
    }

    return true;
  }

  private syncLineFormForCurrentSelection(): void {
    const selectedLine = this.getLineEditorSelectedPurchaseOrderLine();
    if (!selectedLine) {
      return;
    }

    const availableLocations = this.getAvailableLineLocations();
    if (this.lineForm.location_id && !availableLocations.some((location) => location.id === this.lineForm.location_id)) {
      this.lineForm.location_id = '';
    }

    if (!this.lineEditorRequiresBatchTracking()) {
      this.lineForm.batch_id = '';
      return;
    }

    const availableBatches = this.getAvailableLineBatches();
    if (this.lineForm.batch_id && !availableBatches.some((batch) => batch.id === this.lineForm.batch_id)) {
      this.lineForm.batch_id = '';
    }
  }

  private getCreateAvailablePurchaseOrderLines(): PurchaseOrderLineResponse[] {
    return this.detailPurchaseOrderLines
      .filter((line) => this.getRemainingCapacityForPurchaseOrderLine(line.id) > 0)
      .sort((left, right) => left.line_number - right.line_number);
  }

  private getDraftAllocatedForPurchaseOrderLine(purchaseOrderLineId: string, excludeLineId?: string): number {
    if (!this.selectedReceipt) {
      return 0;
    }

    return this.selectedReceipt.lines
      .filter((line) => line.purchase_order_line_id === purchaseOrderLineId && line.id !== excludeLineId)
      .reduce((sum, line) => sum + Number(line.quantity_received || 0), 0);
  }

  private getRemainingCapacityForPurchaseOrderLine(purchaseOrderLineId: string, excludeLineId?: string): number {
    const purchaseOrderLine = this.getPurchaseOrderLine(purchaseOrderLineId);
    if (!purchaseOrderLine) {
      return 0;
    }

    const ordered = Number(purchaseOrderLine.quantity_ordered || 0);
    const alreadyReceived = Number(purchaseOrderLine.quantity_received || 0);
    const allocatedOnCurrentReceipt = this.getDraftAllocatedForPurchaseOrderLine(purchaseOrderLineId, excludeLineId);

    return Math.max(0, ordered - alreadyReceived - allocatedOnCurrentReceipt);
  }

  private hasDuplicateSplitDimension(
    purchaseOrderLineId: string,
    locationId: string,
    batchId: string | null,
    qualityStatus: QualityStatus,
    excludeLineId?: string
  ): boolean {
    if (!this.selectedReceipt) {
      return false;
    }

    return this.selectedReceipt.lines.some((line) =>
      line.id !== excludeLineId
      && line.purchase_order_line_id === purchaseOrderLineId
      && line.location_id === locationId
      && this.normalizeOptionalId(line.batch_id) === batchId
      && line.quality_status === qualityStatus
    );
  }

  private enrichPurchaseOrder(order: PurchaseOrderResponse): PurchaseOrderResponse {
    const supplier = this.suppliers.find((item) => item.id === order.supplier_id);
    const warehouse = this.warehouses.find((item) => item.id === order.warehouse_id);

    return {
      ...order,
      supplier_name: supplier?.name || order.supplier_name,
      warehouse_name: warehouse?.name || order.warehouse_name
    };
  }

  private enrichPurchaseOrderById(orderId: string): PurchaseOrderResponse | null {
    const purchaseOrder = this.availablePurchaseOrders.find((item) => item.id === orderId);
    return purchaseOrder ? this.enrichPurchaseOrder(purchaseOrder) : null;
  }

  private enrichPurchaseOrderLine(line: PurchaseOrderLineResponse): PurchaseOrderLineResponse {
    const product = this.products.find((item) => item.id === line.product_id);

    return {
      ...line,
      product_name: product?.name || line.product_name,
      product_sku: product?.sku || line.product_sku
    };
  }

  private refreshSelectedReceiptIfOpen(receiptId?: string): void {
    const targetReceiptId = receiptId || this.selectedReceipt?.id;
    if (targetReceiptId && this.showDetailModal) {
      this.loadReceiptDetail(targetReceiptId);
    }
    this.loadReceipts();
  }

  private normalizeOptionalText(value?: string | null): string | null {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private normalizeOptionalId(value?: string | null): string | null {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private closeLineMutations(): void {
    this.showLineEditorModal = false;
    this.showDeleteLineConfirm = false;
    this.selectedLine = null;
    this.lineToDelete = null;
    this.lineSubmitting = false;
    this.lineEditorMode = 'create';
    this.lineForm = this.selectedReceipt
      ? this.initLineForm(this.selectedReceipt.id)
      : this.initLineForm();
  }

  private resetLineReferences(): void {
    this.receiptLocations = [];
    this.batchCatalog = [];
    this.loadingLineReferences = false;
  }
}
