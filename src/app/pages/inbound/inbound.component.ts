import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
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

@Component({
  selector: 'app-inbound',
  templateUrl: './inbound.component.html',
  styleUrls: ['./inbound.component.css']
})
export class InboundComponent implements OnInit {
  receipts: InboundReceiptResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  suppliers: BusinessPartnerResponse[] = [];
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
  selectedReceipt: InboundReceiptResponse | null = null;
  receiptToDelete: InboundReceiptResponse | null = null;
  receiptToConfirm: InboundReceiptResponse | null = null;

  createForm: CreateInboundReceiptRequest = this.initCreateForm();
  editForm: UpdateInboundReceiptRequest = {};
  InboundReceiptStatus = InboundReceiptStatus;
  OrderStatus = OrderStatus;

  constructor(
    private inboundService: InboundService,
    private purchaseOrderService: PurchaseOrderService,
    private purchaseOrderLineService: PurchaseOrderLineService,
    private businessPartnerService: BusinessPartnerService,
    private warehouseService: WarehouseService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadReceipts();
    this.loadReferences();
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
    this.loadReceiptDetail(receipt.id);
  }

  loadReceiptDetail(receiptId: string): void {
    this.detailLoading = true;

    this.inboundService.getById(receiptId).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedReceipt = res.data;
          this.loadDetailPurchaseOrderContext(res.data.purchase_order_id);
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
        this.detailPurchaseOrderLines = purchaseOrderLines.success ? purchaseOrderLines.data : [];
        this.loadingDetailPurchaseOrder = false;
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
    this.loadReceipts();
  }

  closeSubModal(modal: 'edit' | 'delete' | 'confirm'): void {
    if (modal === 'edit') {
      this.showEditModal = false;
      return;
    }

    if (modal === 'delete') {
      this.showDeleteConfirm = false;
      this.receiptToDelete = null;
      return;
    }

    this.showConfirmConfirm = false;
    this.receiptToConfirm = null;
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

  getQualityStatusLabel(status: string): string {
    const normalizedStatus = status?.toUpperCase();
    if (normalizedStatus === 'PASS') {
      return 'Đạt';
    }
    if (normalizedStatus === 'QUARANTINE') {
      return 'Cách ly';
    }
    return status;
  }

  getQualityStatusClass(status: string): string {
    return status?.toUpperCase() === 'QUARANTINE' ? 'badge-quarantine' : 'badge-pass';
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

  private initCreateForm(): CreateInboundReceiptRequest {
    return {
      purchase_order_id: '',
      receipt_date: new Date().toISOString().slice(0, 10)
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

  private refreshSelectedReceiptIfOpen(receiptId?: string): void {
    const targetReceiptId = receiptId || this.selectedReceipt?.id;
    if (targetReceiptId && this.showDetailModal) {
      this.loadReceiptDetail(targetReceiptId);
    }
    this.loadReceipts();
  }
}
