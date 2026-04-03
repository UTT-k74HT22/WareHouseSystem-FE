import { Component, OnInit } from '@angular/core';
import { PurchaseOrderResponse } from '../../dto/response/PurchaseOrder/PurchaseOrderResponse';
import { PurchaseOrderLineResponse } from '../../dto/response/PurchaseOrderLine/PurchaseOrderLineResponse';
import { PurchaseOrderService } from '../../service/PurchaseOrderService/purchase-order.service';
import { PurchaseOrderLineService } from '../../service/PurchaseOrderLineService/purchase-order-line.service';
import { BusinessPartnerService } from '../../service/BusinessPartnerService/business-partner.service';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';
import { ProductService } from '../../service/ProductService/product.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { OrderStatus } from '../../helper/enums/OrderStatus';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { CreatePurchaseOrderRequest, UpdatePurchaseOrderRequest } from '../../dto/request/PurchaseOrder/PurchaseOrderRequest';
import { CreatePurchaseOrderLineRequest, UpdatePurchaseOrderLineRequest } from '../../dto/request/PurchaseOrderLine/PurchaseOrderLineRequest';
import { PurchaseOrderFilters } from '../../service/PurchaseOrderService/purchase-order.service';

@Component({
  selector: 'app-purchase-order',
  templateUrl: './purchase-order.component.html',
  styleUrls: ['./purchase-order.component.css']
})
export class PurchaseOrderComponent implements OnInit {
  createPermissions = ['PERM_PURCHASE_ORDER_CREATE'];
  updatePermissions = ['PERM_PURCHASE_ORDER_UPDATE'];
  deletePermissions = ['PERM_PURCHASE_ORDER_DELETE'];
  lineCreatePermissions = ['PERM_PURCHASE_ORDER_LINE_CREATE'];
  lineUpdatePermissions = ['PERM_PURCHASE_ORDER_LINE_UPDATE'];
  lineDeletePermissions = ['PERM_PURCHASE_ORDER_LINE_DELETE'];

  // ─── Dữ liệu ────────────────────────────────────────────────────
  orders: PurchaseOrderResponse[] = [];
  suppliers: BusinessPartnerResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  products: ProductResponse[] = [];

  // ─── Phân trang ─────────────────────────────────────────────────
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';

  // ─── Bộ lọc ─────────────────────────────────────────────────────
  searchKeyword = '';
  selectedStatus: '' | OrderStatus = '';

  // ─── Trạng thái Modal ────────────────────────────────────────────
  showCreateModal = false;
  showDetailModal = false;
  showEditModal = false;
  showDeleteConfirm = false;
  showConfirmConfirm = false;
  showAddLineModal = false;
  showEditLineModal = false;
  showDeleteLineConfirm = false;

  selectedOrder: PurchaseOrderResponse | null = null;
  orderToDelete: PurchaseOrderResponse | null = null;
  orderToConfirm: PurchaseOrderResponse | null = null;

  // ─── Detail ──────────────────────────────────────────────────────
  detailTab: 'header' | 'lines' = 'header';
  orderLines: PurchaseOrderLineResponse[] = [];
  linesLoading = false;
  selectedLine: PurchaseOrderLineResponse | null = null;
  lineToDelete: PurchaseOrderLineResponse | null = null;

  // ─── Form ────────────────────────────────────────────────────────
  createForm: CreatePurchaseOrderRequest = this.initCreateForm();
  editForm: UpdatePurchaseOrderRequest = {};
  lineForm: CreatePurchaseOrderLineRequest = this.initLineForm('');
  editLineForm: UpdatePurchaseOrderLineRequest = {};

  // ─── Enums ───────────────────────────────────────────────────────
  OrderStatus = OrderStatus;

  constructor(
    private poService: PurchaseOrderService,
    private polService: PurchaseOrderLineService,
    private bpService: BusinessPartnerService,
    private warehouseService: WarehouseService,
    private productService: ProductService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadSuppliers();
    this.loadWarehouses();
    this.loadProducts();
  }

  // ══════════════════════════════════════════════════
  // LOAD DỮ LIỆU
  // ══════════════════════════════════════════════════
  loadOrders(): void {
    this.loading = true;
    const filters: PurchaseOrderFilters = {
      purchaseOrderNumber: this.searchKeyword.trim() || undefined,
      status: this.selectedStatus || undefined,
      sortBy: 'updatedAt',
      direction: 'DESC',
    };

    this.poService.getAll(this.currentPage, this.pageSize, filters).subscribe({
      next: (res) => {
        if (res.success) {
          this.orders = res.data.content.map((order) => this.enrichOrder(order));
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: (error) => {
        this.orders = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.toastr.error(error?.error?.message || 'Không tải được danh sách đơn mua hàng.');
        this.loading = false;
      }
    });
  }

  loadSuppliers(): void {
    this.bpService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.suppliers = res.data.filter((partner) =>
            partner.status === 'ACTIVE' && (partner.type === 'SUPPLIER' || partner.type === 'BOTH')
          );
          this.orders = this.orders.map((order) => this.enrichOrder(order));
        }
      },
      error: () => {
        this.suppliers = [];
        this.toastr.error('Không tải được nhà cung cấp.');
      }
    });
  }

  loadWarehouses(): void {
    this.warehouseService.getList().subscribe({
      next: (res) => {
        if (res.success) {
          this.warehouses = res.data;
          this.orders = this.orders.map((order) => this.enrichOrder(order));
        }
      },
      error: () => {
        this.warehouses = [];
        this.toastr.error('Không tải được danh sách kho.');
      }
    });
  }

  loadProducts(): void {
    this.productService.getAll(0, 200).subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data.content.filter(p => p.status === 'ACTIVE');
        }
      },
      error: () => {
        this.products = [];
        this.toastr.error('Không tải được danh sách sản phẩm.');
      }
    });
  }

  // ══════════════════════════════════════════════════
  // TÌM KIẾM & LỌC
  // ══════════════════════════════════════════════════
  onSearch(): void { this.currentPage = 0; this.loadOrders(); }
  onResetFilter(): void { this.searchKeyword = ''; this.selectedStatus = ''; this.currentPage = 0; this.loadOrders(); }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadOrders();
  }

  // ══════════════════════════════════════════════════
  // TẠO MỚI PO
  // ══════════════════════════════════════════════════
  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  get isCreateFormValid(): boolean {
    return !!this.createForm.supplier_id && !!this.createForm.warehouse_id && !!this.createForm.order_date;
  }

  onCreateSubmit(): void {
    if (!this.isCreateFormValid) {
      this.toastr.warning('Đơn mua hàng', 'Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    this.poService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đơn mua hàng', 'Tạo đơn mua hàng thành công!');
          this.showCreateModal = false;
          this.loadOrders();
          // Mở detail ngay để user thêm lines
          const newOrder = this.enrichOrder(res.data);
          this.openDetailModal(newOrder);
          this.detailTab = 'lines';
        }
      },
      error: (error) => {
        this.toastr.error('Đơn mua hàng', error?.error?.message || 'Tạo đơn mua hàng thất bại.');
      }
    });
  }

  // ══════════════════════════════════════════════════
  // CHI TIẾT PO
  // ══════════════════════════════════════════════════
  openDetailModal(order: PurchaseOrderResponse): void {
    this.selectedOrder = order;
    this.detailTab = 'header';
    this.orderLines = [];
    this.showDetailModal = true;
    this.loadOrderDetail(order.id);
    this.loadOrderLines(order.id);
  }

  loadOrderDetail(orderId: string): void {
    this.poService.getById(orderId).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedOrder = this.enrichOrder(res.data);
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Không tải được chi tiết đơn hàng.');
      }
    });
  }

  loadOrderLines(orderId: string): void {
    this.linesLoading = true;
    this.polService.getByPurchaseOrderId(orderId).subscribe({
      next: (res) => {
        if (res.success) {
          this.orderLines = (res.data || []).map(line => this.enrichLine(line));
        }
        this.linesLoading = false;
      },
      error: (error) => {
        this.orderLines = [];
        this.linesLoading = false;
        this.toastr.error(error?.error?.message || 'Không tải được dòng đơn hàng.');
      }
    });
  }

  // ══════════════════════════════════════════════════
  // SỬA HEADER PO (DRAFT only)
  // ══════════════════════════════════════════════════
  openEditModal(): void {
    if (!this.selectedOrder || !this.isDraft(this.selectedOrder)) return;
    this.editForm = {
      supplier_id: this.selectedOrder.supplier_id,
      warehouse_id: this.selectedOrder.warehouse_id,
      order_date: this.selectedOrder.order_date,
      expected_delivery_date: this.selectedOrder.expected_delivery_date ?? undefined,
      currency: this.selectedOrder.currency,
      payment_terms: this.selectedOrder.payment_terms ?? undefined,
      notes: this.selectedOrder.notes ?? undefined,
    };
    this.showEditModal = true;
  }

  get isEditFormValid(): boolean {
    return !!this.editForm.supplier_id && !!this.editForm.warehouse_id;
  }

  onEditSubmit(): void {
    if (!this.selectedOrder || !this.isEditFormValid) return;
    this.poService.update(this.selectedOrder.id, this.editForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đơn mua hàng', 'Cập nhật đơn hàng thành công!');
          this.selectedOrder = this.enrichOrder(res.data);
          this.showEditModal = false;
          this.loadOrders();
        }
      },
      error: (error) => {
        if (error?.status === 400 && error?.error?.error_code === 'PO_002') {
          this.toastr.error('Đơn mua hàng', 'Đơn hàng không còn ở trạng thái Nháp. Đã chuyển sang chỉ xem.');
          this.loadOrderDetail(this.selectedOrder!.id);
          this.showEditModal = false;
        } else {
          this.toastr.error('Đơn mua hàng', error?.error?.message || 'Cập nhật đơn hàng thất bại.');
        }
      }
    });
  }

  // ══════════════════════════════════════════════════
  // XOÁ PO (DRAFT only)
  // ══════════════════════════════════════════════════
  openDeleteConfirm(order: PurchaseOrderResponse): void {
    this.orderToDelete = order;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.orderToDelete) return;
    const deletedId = this.orderToDelete.id;
    this.poService.delete(deletedId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đơn mua hàng', 'Xoá đơn hàng thành công!');
          this.showDeleteConfirm = false;
          this.orderToDelete = null;
          if (this.selectedOrder?.id === deletedId) {
            this.showDetailModal = false;
            this.selectedOrder = null;
          }
          this.loadOrders();
        }
      },
      error: (error) => {
        this.toastr.error('Đơn mua hàng', error?.error?.message || 'Xoá đơn hàng thất bại.');
      }
    });
  }

  // ══════════════════════════════════════════════════
  // XÁC NHẬN PO (DRAFT only, cần >=1 line)
  // ══════════════════════════════════════════════════
  openConfirmConfirm(order: PurchaseOrderResponse): void {
    this.orderToConfirm = order;
    this.showConfirmConfirm = true;
  }

  onConfirmOrder(): void {
    if (!this.orderToConfirm) return;
    const orderId = this.orderToConfirm.id;
    this.poService.confirm(orderId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đơn mua hàng', 'Đã xác nhận đơn mua hàng thành công!');
          this.showConfirmConfirm = false;
          this.orderToConfirm = null;
          if (this.selectedOrder?.id === orderId) {
            this.selectedOrder = this.enrichOrder(res.data);
          }
          this.loadOrders();
        }
      },
      error: (error) => {
        this.showConfirmConfirm = false;
        this.orderToConfirm = null;
        const msg = error?.error?.message || 'Xác nhận đơn mua hàng thất bại.';
        this.toastr.error('Đơn mua hàng', msg);
        if (this.selectedOrder?.id === orderId) {
          this.loadOrderDetail(orderId);
          this.loadOrderLines(orderId);
        }
      }
    });
  }

  // ══════════════════════════════════════════════════
  // QUẢN LÝ LINES (DRAFT only)
  // ══════════════════════════════════════════════════

  // --- Thêm line ---
  openAddLineModal(): void {
    if (!this.selectedOrder || !this.isDraft(this.selectedOrder)) return;
    this.lineForm = this.initLineForm(this.selectedOrder.id);
    this.showAddLineModal = true;
  }

  get isLineFormValid(): boolean {
    return !!this.lineForm.product_id
      && this.lineForm.quantity_ordered !== null && this.lineForm.quantity_ordered > 0
      && this.lineForm.unit_price !== null && this.lineForm.unit_price >= 0;
  }

  onAddLineSubmit(): void {
    if (!this.isLineFormValid) {
      this.toastr.warning('Đơn mua hàng', 'Vui lòng điền đầy đủ thông tin dòng đơn hàng.');
      return;
    }
    this.polService.create(this.lineForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đơn mua hàng', 'Thêm dòng đơn hàng thành công!');
          this.showAddLineModal = false;
          this.refreshAfterLineMutation();
        }
      },
      error: (error) => {
        const code = error?.error?.error_code;
        if (code === 'POL_005') {
          this.toastr.error('Đơn mua hàng', 'Sản phẩm đã tồn tại trong đơn hàng. Vui lòng chọn sản phẩm khác.');
        } else if (code === 'PO_002') {
          this.toastr.error('Đơn mua hàng', 'Đơn hàng không còn ở trạng thái Nháp.');
          this.refreshAfterLineMutation();
          this.showAddLineModal = false;
        } else {
          this.toastr.error('Đơn mua hàng', error?.error?.message || 'Thêm dòng đơn hàng thất bại.');
        }
      }
    });
  }

  // --- Sửa line ---
  openEditLineModal(line: PurchaseOrderLineResponse): void {
    if (!this.selectedOrder || !this.isDraft(this.selectedOrder)) return;
    this.selectedLine = line;
    this.editLineForm = {
      product_id: line.product_id,
      quantity_ordered: line.quantity_ordered,
      unit_price: line.unit_price,
      notes: line.notes ?? undefined,
    };
    this.showEditLineModal = true;
  }

  get isEditLineFormValid(): boolean {
    return !!this.editLineForm.quantity_ordered && this.editLineForm.quantity_ordered > 0
      && this.editLineForm.unit_price !== undefined && this.editLineForm.unit_price >= 0;
  }

  onEditLineSubmit(): void {
    if (!this.selectedLine || !this.isEditLineFormValid) return;
    this.polService.update(this.selectedLine.id, this.editLineForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đơn mua hàng', 'Cập nhật dòng đơn hàng thành công!');
          this.showEditLineModal = false;
          this.selectedLine = null;
          this.refreshAfterLineMutation();
        }
      },
      error: (error) => {
        const code = error?.error?.error_code;
        if (code === 'POL_005') {
          this.toastr.error('Đơn mua hàng', 'Sản phẩm đã tồn tại trong đơn hàng.');
        } else if (code === 'PO_002') {
          this.toastr.error('Đơn mua hàng', 'Đơn hàng không còn ở trạng thái Nháp.');
          this.refreshAfterLineMutation();
          this.showEditLineModal = false;
        } else {
          this.toastr.error('Đơn mua hàng', error?.error?.message || 'Cập nhật dòng đơn hàng thất bại.');
        }
      }
    });
  }

  // --- Xóa line ---
  openDeleteLineConfirm(line: PurchaseOrderLineResponse): void {
    this.lineToDelete = line;
    this.showDeleteLineConfirm = true;
  }

  onDeleteLineConfirm(): void {
    if (!this.lineToDelete) return;
    this.polService.delete(this.lineToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đơn mua hàng', 'Xoá dòng đơn hàng thành công!');
          this.showDeleteLineConfirm = false;
          this.lineToDelete = null;
          this.refreshAfterLineMutation();
        }
      },
      error: (error) => {
        this.toastr.error('Đơn mua hàng', error?.error?.message || 'Xoá dòng đơn hàng thất bại.');
      }
    });
  }

  /** Refresh lines + header after any line mutation */
  private refreshAfterLineMutation(): void {
    if (this.selectedOrder) {
      this.loadOrderLines(this.selectedOrder.id);
      this.loadOrderDetail(this.selectedOrder.id);
    }
  }

  // ══════════════════════════════════════════════════
  // ĐÓNG MODALS
  // ══════════════════════════════════════════════════
  closeAllModals(): void {
    this.showCreateModal = false;
    this.showDetailModal = false;
    this.showEditModal = false;
    this.showDeleteConfirm = false;
    this.showConfirmConfirm = false;
    this.showAddLineModal = false;
    this.showEditLineModal = false;
    this.showDeleteLineConfirm = false;
    this.selectedOrder = null;
    this.orderToDelete = null;
    this.orderToConfirm = null;
    this.selectedLine = null;
    this.lineToDelete = null;
    this.orderLines = [];
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedOrder = null;
    this.orderLines = [];
    this.loadOrders();
  }

  closeSubModal(modal: string): void {
    switch (modal) {
      case 'edit': this.showEditModal = false; break;
      case 'delete': this.showDeleteConfirm = false; this.orderToDelete = null; break;
      case 'confirm': this.showConfirmConfirm = false; this.orderToConfirm = null; break;
      case 'addLine': this.showAddLineModal = false; break;
      case 'editLine': this.showEditLineModal = false; this.selectedLine = null; break;
      case 'deleteLine': this.showDeleteLineConfirm = false; this.lineToDelete = null; break;
    }
  }

  // ══════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════
  isDraft(order: PurchaseOrderResponse): boolean {
    return order.status === OrderStatus.DRAFT;
  }

  canCreateReceipt(order: PurchaseOrderResponse): boolean {
    return order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PARTIALLY_RECEIVED;
  }

  private initCreateForm(): CreatePurchaseOrderRequest {
    return {
      supplier_id: '',
      warehouse_id: '',
      order_date: new Date().toISOString().slice(0, 10),
      currency: 'VND',
    };
  }

  private initLineForm(purchaseOrderId: string): CreatePurchaseOrderLineRequest {
    return {
      purchase_order_id: purchaseOrderId,
      product_id: '',
      quantity_ordered: null,
      unit_price: null,
    };
  }

  private enrichOrder(order: PurchaseOrderResponse): PurchaseOrderResponse {
    const supplier = this.suppliers.find((item) => item.id === order.supplier_id);
    const warehouse = this.warehouses.find((item) => item.id === order.warehouse_id);
    return {
      ...order,
      supplier_name: supplier?.name || order.supplier_name,
      warehouse_name: warehouse?.name || order.warehouse_name,
    };
  }

  private enrichLine(line: PurchaseOrderLineResponse): PurchaseOrderLineResponse {
    const product = this.products.find((p) => p.id === line.product_id);
    return {
      ...line,
      product_name: product?.name || line.product_name,
      product_sku: product?.sku || line.product_sku,
    };
  }

  getProductName(productId: string): string {
    const product = this.products.find(p => p.id === productId);
    return product ? `${product.sku} - ${product.name}` : productId;
  }

  getSupplierName(supplierId: string): string {
    const supplier = this.suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : supplierId;
  }

  getWarehouseName(warehouseId: string): string {
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : warehouseId;
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.DRAFT]: 'Nháp',
      [OrderStatus.CONFIRMED]: 'Đã xác nhận',
      [OrderStatus.PARTIALLY_RECEIVED]: 'Nhận một phần',
      [OrderStatus.PARTIALLY_SHIPPED]: 'Giao một phần',
      [OrderStatus.IN_PROGRESS]: 'Đang xử lý',
      [OrderStatus.COMPLETED]: 'Hoàn thành',
      [OrderStatus.CANCELLED]: 'Đã huỷ'
    };
    return labels[status] || status;
  }

  getStatusClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      [OrderStatus.DRAFT]: 'badge-draft',
      [OrderStatus.CONFIRMED]: 'badge-confirmed',
      [OrderStatus.PARTIALLY_RECEIVED]: 'badge-progress',
      [OrderStatus.PARTIALLY_SHIPPED]: 'badge-progress',
      [OrderStatus.IN_PROGRESS]: 'badge-progress',
      [OrderStatus.COMPLETED]: 'badge-completed',
      [OrderStatus.CANCELLED]: 'badge-cancelled'
    };
    return classes[status] || '';
  }

  getDraftCount(): number { return this.orders.filter(o => o.status === OrderStatus.DRAFT).length; }
  getConfirmedCount(): number { return this.orders.filter(o => o.status === OrderStatus.CONFIRMED || o.status === OrderStatus.PARTIALLY_RECEIVED).length; }
  getCompletedCount(): number { return this.orders.filter(o => o.status === OrderStatus.COMPLETED).length; }

  getLinesSubTotal(): number {
    return this.orderLines.reduce((sum, l) => sum + (l.line_total || 0), 0);
  }

  getAvailableProducts(excludeProductId?: string): ProductResponse[] {
    const usedProductIds = new Set(this.orderLines.map(l => l.product_id));
    if (excludeProductId) usedProductIds.delete(excludeProductId);
    return this.products.filter(p => !usedProductIds.has(p.id));
  }
}
