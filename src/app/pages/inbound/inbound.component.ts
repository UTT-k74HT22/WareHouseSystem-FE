import { Component, OnInit } from '@angular/core';
import { InboundReceiptResponse } from '../../dto/response/InboundReceipt/InboundReceiptResponse';
import { InboundReceiptLineResponse } from '../../dto/response/InboundReceiptLine/InboundReceiptLineResponse';
import {
  InboundReceiptFilters,
  InboundService
} from '../../service/InboundService/inbound.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { InboundReceiptStatus } from '../../helper/enums/InboundReceiptStatus';
import { OrderStatus } from '../../helper/enums/OrderStatus';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import {
  CreateInboundReceiptRequest,
  UpdateInboundReceiptRequest
} from '../../dto/request/InboundReceipt/InboundReceiptRequest';
import { PurchaseOrderResponse } from '../../dto/response/PurchaseOrder/PurchaseOrderResponse';
import { PurchaseOrderLineResponse } from '../../dto/response/PurchaseOrderLine/PurchaseOrderLineResponse';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { LocationResponse } from '../../dto/response/Location/LocationResponse';
import { BatchResponse } from '../../dto/response/Batch/BatchResponse';
import { InboundReceiptLineService } from '../../service/InboundReceiptLineService/inbound-receipt-line.service';
import { QualityStatus } from '../../helper/enums/QualityStatus';
import { LocationStatus } from '../../helper/enums/LocationStatus';
import { BatchStatus } from '../../helper/enums/BatchStatus';
import {
  createInboundReceiptLineForm,
  createInboundReceiptLineFormFromLine,
  InboundLineEditorContext,
  InboundLineEditorMode,
  InboundLineEditorService,
  InboundReceiptLineFormState
} from '../../service/InboundService/inbound-line-editor.service';
import { InboundReferenceDataService } from '../../service/InboundService/inbound-reference-data.service';

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
  lineEditorMode: InboundLineEditorMode = 'create';

  createForm: CreateInboundReceiptRequest = this.initCreateForm();
  editForm: UpdateInboundReceiptRequest = {};
  lineForm: InboundReceiptLineFormState = createInboundReceiptLineForm();

  InboundReceiptStatus = InboundReceiptStatus;
  OrderStatus = OrderStatus;
  QualityStatus = QualityStatus;
  LocationStatus = LocationStatus;
  BatchStatus = BatchStatus;

  constructor(
    private inboundService: InboundService,
    private inboundReceiptLineService: InboundReceiptLineService,
    private inboundReferenceDataService: InboundReferenceDataService,
    private inboundLineEditorService: InboundLineEditorService,
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

    this.inboundReferenceDataService.loadBaseReferences().subscribe({
      next: ({ suppliers, warehouses }) => {
        this.suppliers = suppliers;
        this.warehouses = warehouses;
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

    this.inboundReferenceDataService.loadProductCatalog().subscribe({
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

          const shouldLoadLineReferences = res.data.status === InboundReceiptStatus.DRAFT
            || this.hasMissingLineDisplayInfo(res.data);

          if (shouldLoadLineReferences) {
            this.loadLineReferences(res.data, res.data.status !== InboundReceiptStatus.DRAFT);
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

    this.inboundReferenceDataService.loadPurchaseOrderContext(purchaseOrderId).subscribe({
      next: ({ purchaseOrder, purchaseOrderLines }) => {
        this.detailPurchaseOrder = purchaseOrder ? this.enrichPurchaseOrder(purchaseOrder) : null;
        this.detailPurchaseOrderLines = purchaseOrderLines.map((line) => this.enrichPurchaseOrderLine(line));
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
      this.toastr.warning('Không còn dòng đơn mua hàng nào có thể nhận thêm trên phiếu nh��p này.');
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
      && this.inboundLineEditorService.getCreateAvailablePurchaseOrderLines(this.getLineEditorContext()).length > 0;
  }

  isLineEditorBusy(): boolean {
    return this.inboundLineEditorService.isBusy(this.getLineEditorContext());
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
    return this.inboundLineEditorService.getPurchaseOrderLine(this.getLineEditorContext(), lineId);
  }

  getReceiptLineRemaining(line: InboundReceiptLineResponse): number | null {
    return this.inboundLineEditorService.getReceiptLineRemaining(this.getLineEditorContext(), line);
  }

  getRemainingAfterThisReceipt(line: InboundReceiptLineResponse): number | null {
    return this.inboundLineEditorService.getRemainingAfterThisReceipt(this.getLineEditorContext(), line);
  }

  getLineEditorSelectedPurchaseOrderLine(): PurchaseOrderLineResponse | undefined {
    return this.inboundLineEditorService.getSelectedPurchaseOrderLine(this.getLineEditorContext());
  }

  getLineEditorSelectedProduct(): ProductResponse | undefined {
    return this.inboundLineEditorService.getSelectedProduct(this.getLineEditorContext());
  }

  lineEditorRequiresBatchTracking(): boolean {
    return this.inboundLineEditorService.requiresBatchTracking(this.getLineEditorContext());
  }

  getSelectablePurchaseOrderLines(): PurchaseOrderLineResponse[] {
    return this.inboundLineEditorService.getSelectablePurchaseOrderLines(this.getLineEditorContext());
  }

  getPurchaseOrderLineOptionLabel(line: PurchaseOrderLineResponse): string {
    return this.inboundLineEditorService.getLineOptionLabel(this.getLineEditorContext(), line);
  }

  getAvailableLineLocations(): LocationResponse[] {
    return this.inboundLineEditorService.getAvailableLineLocations(this.getLineEditorContext());
  }

  getAvailableLineBatches(): BatchResponse[] {
    return this.inboundLineEditorService.getAvailableLineBatches(this.getLineEditorContext());
  }

  getCurrentLineRemainingCapacity(): number | null {
    return this.inboundLineEditorService.getCurrentLineRemainingCapacity(this.getLineEditorContext());
  }

  getCurrentLineDraftAllocated(): number | null {
    return this.inboundLineEditorService.getCurrentLineDraftAllocated(this.getLineEditorContext());
  }

  getLineProductDisplay(line: InboundReceiptLineResponse): string {
    const directName = this.normalizeText(line.product_name);
    if (directName) {
      return directName;
    }

    const poLineName = this.normalizeText(this.getPurchaseOrderLine(line.purchase_order_line_id)?.product_name);
    if (poLineName) {
      return poLineName;
    }

    const productName = this.normalizeText(this.products.find((item) => item.id === line.product_id)?.name);
    return productName || 'Khong ro san pham';
  }

  getLineProductSkuDisplay(line: InboundReceiptLineResponse): string | null {
    return this.normalizeText(line.product_sku)
      || this.normalizeText(this.products.find((item) => item.id === line.product_id)?.sku)
      || null;
  }

  getLineLocationDisplay(line: InboundReceiptLineResponse): string {
    const directName = this.normalizeText(line.location_name);
    if (directName) {
      return directName;
    }

    const location = this.receiptLocations.find((item) => item.id === line.location_id);
    const locationName = this.normalizeText(location?.name);
    if (locationName) {
      return locationName;
    }

    return this.normalizeText(line.location_code)
      || this.normalizeText(location?.code)
      || 'Khong ro vi tri';
  }

  getLineBatchDisplay(line: InboundReceiptLineResponse): string {
    if (!line.batch_id) {
      return 'Khong theo doi lo';
    }

    const directBatch = this.normalizeText(line.batch_number);
    if (directBatch) {
      return directBatch;
    }

    return this.normalizeText(this.batchCatalog.find((item) => item.id === line.batch_id)?.batch_number)
      || 'Chua xac dinh lo';
  }

  getLinePoSummary(line: InboundReceiptLineResponse): string {
    const purchaseOrderLine = this.getPurchaseOrderLine(line.purchase_order_line_id);
    if (!purchaseOrderLine) {
      return '—';
    }

    const ordered = this.formatQuantity(purchaseOrderLine.quantity_ordered);
    const received = this.formatQuantity(purchaseOrderLine.quantity_received);
    const remaining = this.getReceiptLineRemaining(line);

    return `Dat ${ordered} | Da nhan ${received} | Con ${remaining === null ? '—' : this.formatQuantity(remaining)}`;
  }

  getLineNotesDisplay(line: InboundReceiptLineResponse): string {
    return this.normalizeText(line.notes) || '—';
  }

  private loadAvailablePurchaseOrders(): void {
    this.loadingAvailablePurchaseOrders = true;

    this.inboundReferenceDataService.loadAvailablePurchaseOrders().subscribe({
      next: (orders) => {
        this.availablePurchaseOrders = orders.map((order) => this.enrichPurchaseOrder(order));
        this.loadingAvailablePurchaseOrders = false;
      },
      error: (error) => {
        this.availablePurchaseOrders = [];
        this.loadingAvailablePurchaseOrders = false;
        this.toastr.error(error?.error?.message || 'Không tải được danh sách đơn mua hàng hợp lệ.');
      }
    });
  }

  private loadLineReferences(receipt: InboundReceiptResponse, silent = false): void {
    this.loadingLineReferences = true;

    this.inboundReferenceDataService.loadLineReferences(receipt.warehouse_id).subscribe({
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
        if (!silent) {
          this.toastr.error('Không tải được dữ liệu vị trí/lô cho màn sửa dòng phiếu nhập.');
        }
      }
    });
  }

  private initCreateForm(): CreateInboundReceiptRequest {
    return {
      purchase_order_id: '',
      receipt_date: new Date().toISOString().slice(0, 10)
    };
  }

  private initLineForm(receiptId = '', purchaseOrderLineId = ''): InboundReceiptLineFormState {
    return createInboundReceiptLineForm(receiptId, purchaseOrderLineId);
  }

  private initLineFormFromLine(line: InboundReceiptLineResponse): InboundReceiptLineFormState {
    return createInboundReceiptLineFormFromLine(line);
  }

  private buildCreateLineRequest() {
    return this.inboundLineEditorService.buildCreateRequest(this.lineForm);
  }

  private buildUpdateLineRequest() {
    return this.inboundLineEditorService.buildUpdateRequest(this.lineForm);
  }

  private validateLineForm(): boolean {
    const errorMessage = this.inboundLineEditorService.validateForm(this.getLineEditorContext());
    if (errorMessage) {
      this.toastr.warning(errorMessage);
      return false;
    }

    return true;
  }

  private syncLineFormForCurrentSelection(): void {
    this.lineForm = this.inboundLineEditorService.syncFormForCurrentSelection(this.getLineEditorContext());
  }

  private getCreateAvailablePurchaseOrderLines(): PurchaseOrderLineResponse[] {
    return this.inboundLineEditorService.getCreateAvailablePurchaseOrderLines(this.getLineEditorContext());
  }

  private getLineEditorContext(): InboundLineEditorContext {
    return {
      selectedReceipt: this.selectedReceipt,
      selectedLine: this.selectedLine,
      detailPurchaseOrderLines: this.detailPurchaseOrderLines,
      products: this.products,
      receiptLocations: this.receiptLocations,
      batchCatalog: this.batchCatalog,
      lineForm: this.lineForm,
      lineEditorMode: this.lineEditorMode,
      loadingLineReferences: this.loadingLineReferences,
      loadingDetailPurchaseOrder: this.loadingDetailPurchaseOrder,
      loadingProductCatalog: this.loadingProductCatalog
    };
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

  private hasMissingLineDisplayInfo(receipt: InboundReceiptResponse): boolean {
    return receipt.lines.some((line) => {
      const missingProduct = !this.normalizeText(line.product_name);
      const missingLocation = !this.normalizeText(line.location_name);
      const missingBatch = !!line.batch_id && !this.normalizeText(line.batch_number);
      return missingProduct || missingLocation || missingBatch;
    });
  }

  private normalizeText(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private formatQuantity(value: number): string {
    return value.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}
