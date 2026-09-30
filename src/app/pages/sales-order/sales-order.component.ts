import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { SalesOrderLineResponse } from '../../dto/response/SalesOrderLine/SalesOrderLineResponse';
import { SalesOrderResponse } from '../../dto/response/SalesOrder/SalesOrderResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { OrderStatus } from '../../helper/enums/OrderStatus';
import { BusinessPartnerService } from '../../service/BusinessPartnerService/business-partner.service';
import { ProductService } from '../../service/ProductService/product.service';
import { SalesOrderService } from '../../service/SalesOrderService/sales-order.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';
import {
  CheckInventoryAvailabilityResponse,
  InventoryService
} from '../../service/InventoryService/inventory.service';

@Component({
  selector: 'app-sales-order',
  templateUrl: './sales-order.component.html',
  styleUrls: ['./sales-order.component.css']
})
export class SalesOrderComponent implements OnInit {
  createPermissions = ['PERM_SALES_ORDER_CREATE'];
  updatePermissions = ['PERM_SALES_ORDER_UPDATE'];

  orders: SalesOrderResponse[] = [];
  customers: BusinessPartnerResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  products: ProductResponse[] = [];

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';
  detailTab: 'header' | 'lines' = 'header';

  searchKeyword = '';
  productSearchKeyword = '';
  productSearchFocused = false;
  selectedStatus: '' | OrderStatus = '';
  selectedCustomerId = '';
  selectedWarehouseId = '';
  orderDateFrom = '';
  orderDateTo = '';

  showCreateModal = false;
  showDetailModal = false;
  showCancelConfirm = false;
  selectedOrder: SalesOrderResponse | null = null;
  orderToCancel: SalesOrderResponse | null = null;

  draftCount = 0;
  confirmedCount = 0;
  completedCount = 0;
  cancelledCount = 0;

  createForm: FormGroup;
  OrderStatus = OrderStatus;

  constructor(
    private fb: FormBuilder,
    private soService: SalesOrderService,
    private bpService: BusinessPartnerService,
  private warehouseService: WarehouseService,
  private productService: ProductService,
    private inventoryService: InventoryService,
    private toastr: ToastrService
  ) {
    this.createForm = this.fb.group({
      customer_id: ['', Validators.required],
      warehouse_id: ['', Validators.required],
      order_date: [new Date().toISOString().slice(0, 10), Validators.required],
      requested_delivery_date: [this.getDefaultDeliveryDate(), Validators.required],
      currency: ['VND', Validators.required],
      notes: [''],
      lines: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadOrders();
    this.loadCustomers();
    this.loadWarehouses();
    this.loadProducts();
  }

  get lines(): FormArray {
    return this.createForm.get('lines') as FormArray;
  }

  addLine(): void {
    this.addProductLine();
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) {
      this.toastr.warning('Đơn hàng cần ít nhất một dòng sản phẩm.');
      return;
    }
    this.lines.removeAt(index);
  }

  private loadSeq = 0;

  loadOrders(silent = false): void {
    if (!silent) {
      this.loading = true;
      this.loadStats();
    }
    const seq = ++this.loadSeq;
    const filters = {
      soNumber: this.searchKeyword.trim() || undefined,
      status: this.selectedStatus || undefined,
      customerId: this.selectedCustomerId || undefined,
      warehouseId: this.selectedWarehouseId || undefined,
      orderDateFrom: this.orderDateFrom || undefined,
      orderDateTo: this.orderDateTo || undefined,
      sortBy: 'updatedAt',
      direction: 'DESC'
    };

    this.soService.getAll(filters, this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (seq !== this.loadSeq) {
          return;
        }
        if (res.success) {
          this.orders = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: (error) => {
        if (seq !== this.loadSeq) {
          return;
        }
        this.orders = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
        this.toastr.error(error?.error?.message || 'Không thể tải danh sách đơn xuất hàng.');
      }
    });
  }

  private loadStats(): void {
    this.soService.getStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.draftCount = res.data['draft'] ?? 0;
          this.confirmedCount = (res.data['confirmed'] ?? 0) + (res.data['partially_shipped'] ?? 0);
          this.completedCount = res.data['completed'] ?? 0;
          this.cancelledCount = res.data['cancelled'] ?? 0;
        }
      },
      error: () => { /* giữ số cũ khi lỗi */ }
    });
  }

  loadCustomers(): void {
    this.bpService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.customers = res.data.filter((bp) =>
            bp.status === 'ACTIVE' && (bp.type === 'CUSTOMER' || bp.type === 'BOTH')
          );
        }
      },
      error: () => {
        this.customers = [];
        this.toastr.error('Không thể tải danh sách khách hàng.');
      }
    });
  }

  loadWarehouses(): void {
    this.warehouseService.getList().subscribe({
      next: (res) => {
        if (res.success) {
          this.warehouses = res.data.filter((warehouse) => warehouse.status === 'ACTIVE');
        }
      },
      error: () => {
        this.warehouses = [];
        this.toastr.error('Không thể tải danh sách kho.');
      }
    });
  }

  loadProducts(): void {
    this.productService.getFullList().subscribe({
      next: (products) => {
        this.products = products.filter((product) => product.status === 'ACTIVE');
      },
      error: () => {
        this.products = [];
        this.toastr.error('Không thể tải danh sách sản phẩm.');
      }
    });
  }

  getDraftCount(): number { return this.draftCount; }
  getConfirmedCount(): number { return this.confirmedCount; }
  getCompletedCount(): number { return this.completedCount; }
  getCancelledCount(): number { return this.cancelledCount; }

  canConfirmOrder(order: SalesOrderResponse): boolean {
    return order.status === OrderStatus.DRAFT;
  }

  canCancelOrder(order: SalesOrderResponse): boolean {
    return order.status === OrderStatus.DRAFT || order.status === OrderStatus.CONFIRMED;
  }

  canEditOrder(order: SalesOrderResponse): boolean {
    return order.status === OrderStatus.DRAFT;
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadOrders(true);
  }

  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedStatus = '';
    this.selectedCustomerId = '';
    this.selectedWarehouseId = '';
    this.orderDateFrom = '';
    this.orderDateTo = '';
    this.currentPage = 0;
    this.loadOrders(true);
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadOrders();
  }

  openCreateModal(): void {
    this.productSearchKeyword = '';
    this.createForm.reset({
      customer_id: '',
      warehouse_id: '',
      order_date: new Date().toISOString().slice(0, 10),
      requested_delivery_date: this.getDefaultDeliveryDate(),
      currency: 'VND',
      notes: ''
    });
    this.lines.clear();
    this.addLine();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    const validationMessage = this.getCreateValidationMessage();
    if (validationMessage) {
      this.toastr.warning('Đơn xuất hàng', validationMessage);
      this.createForm.markAllAsTouched();
      return;
    }

    this.checkAvailabilityBeforeCreate();
  }

  private checkAvailabilityBeforeCreate(): void {
    const warehouseId = this.createForm.get('warehouse_id')?.value;
    const quantitiesByProduct = new Map<string, number>();

    this.lines.controls.forEach((line) => {
      const productId = line.get('product_id')?.value;
      const quantity = Number(line.get('quantity_ordered')?.value || 0);
      quantitiesByProduct.set(productId, (quantitiesByProduct.get(productId) || 0) + quantity);
    });

    const checks = Array.from(quantitiesByProduct.entries()).map(([productId, quantity]) =>
      this.inventoryService.checkAvailability({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity
      })
    );

    forkJoin(checks).subscribe({
      next: (responses) => {
        const unavailable = responses.find((response) =>
          !response.success || !this.isInventoryAvailable(response.data)
        );
        if (unavailable) {
          this.showInsufficientStockMessage(unavailable.data);
          return;
        }

        this.createSalesOrder();
      },
      error: () => {
        this.toastr.error(
          'Đơn xuất hàng',
          'Không thể kiểm tra tồn kho khả dụng. Vui lòng thử lại trước khi lưu đơn.'
        );
      }
    });
  }

  private createSalesOrder(): void {
    this.soService.create(this.createForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đơn xuất hàng', 'Tạo đơn xuất hàng thành công.');
          this.showCreateModal = false;
          this.loadOrders();
          this.openDetailModal(res.data);
        }
      },
      error: (error) => {
        this.toastr.error('Đơn xuất hàng', error?.error?.message || 'Có lỗi xảy ra khi tạo đơn xuất hàng.');
      }
    });
  }

  openDetailModal(order: SalesOrderResponse): void {
    this.loading = true;
    this.soService.getById(order.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedOrder = res.data;
          this.showDetailModal = true;
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error(error?.error?.message || 'Không thể tải chi tiết đơn hàng.');
      }
    });
  }

  confirmOrder(id: string): void {
    this.soService.confirm(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đơn xuất hàng', 'Xác nhận đơn hàng thành công.');
          this.selectedOrder = res.data;
          this.loadOrders();
        }
      },
      error: (error) => {
        const errorCode = error?.error?.error_code || error?.error?.errorCode;
        const apiMessage = error?.error?.message;
        const errorMessage = String(apiMessage || '').toLowerCase();
        const isStockError = errorCode === 'INV_004' || errorMessage.includes('tồn kho') || errorMessage.includes('available stock');
        const hasStorageGuidance = errorMessage.includes('storage') || errorMessage.includes('điều chuyển');
        const displayMessage = isStockError
          ? (hasStorageGuidance ? apiMessage : 'Số lượng xuất vượt tồn kho khả dụng. Hãy giảm số lượng hoặc bổ sung tồn kho.')
          : (apiMessage || 'Xác nhận đơn hàng thất bại.');
        this.toastr.error('Đơn xuất hàng', displayMessage);
        if (this.selectedOrder?.id === id) {
          this.openDetailModal(this.selectedOrder);
        }
      }
    });
  }

  openCancelConfirm(order: SalesOrderResponse): void {
    this.orderToCancel = order;
    this.showCancelConfirm = true;
  }

  onCancelConfirm(): void {
    if (!this.orderToCancel) {
      return;
    }

    const orderId = this.orderToCancel.id;
    this.soService.cancel(orderId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đơn xuất hàng', 'Hủy đơn hàng thành công.');
          this.showCancelConfirm = false;
          this.orderToCancel = null;
          if (this.selectedOrder?.id === orderId) {
            this.selectedOrder = res.data;
          }
          this.loadOrders();
        }
      },
      error: (error) => {
        const errorMsg = error?.error?.message || '';
        let displayMsg = 'Hủy đơn hàng thất bại.';
        
        if (errorMsg.toLowerCase().includes('cannot cancel sales order with active shipments')) {
          displayMsg = 'Không thể hủy đơn hàng vì có phiếu xuất đang hoạt động.';
        } else if (errorMsg.toLowerCase().includes('cannot cancel')) {
          displayMsg = 'Không thể hủy đơn hàng này.';
        }
        
        this.toastr.error('Đơn xuất hàng', displayMsg);
        this.showCancelConfirm = false;
        this.orderToCancel = null;
        if (this.selectedOrder?.id === orderId) {
          this.openDetailModal(this.selectedOrder);
        }
      }
    });
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showDetailModal = false;
    this.showCancelConfirm = false;
    this.selectedOrder = null;
    this.orderToCancel = null;
    this.productSearchKeyword = '';
    this.productSearchFocused = false;
  }

  getFilteredProducts(selectedProductId = ''): ProductResponse[] {
    const keyword = this.normalizeSearchText(this.productSearchKeyword);

    if (!keyword) {
      return this.products;
    }

    return this.products.filter((product) =>
      product.id === selectedProductId ||
      this.normalizeSearchText(`${product.sku} ${product.name}`).includes(keyword)
    );
  }

  private getCreateValidationMessage(): string | null {
    if (!this.createForm.get('customer_id')?.value) {
      return 'Vui lòng chọn khách hàng.';
    }
    if (!this.createForm.get('warehouse_id')?.value) {
      return 'Vui lòng chọn kho xuất.';
    }
    if (!this.createForm.get('order_date')?.value) {
      return 'Vui lòng chọn ngày đặt hàng.';
    }
    if (!this.createForm.get('requested_delivery_date')?.value) {
      return 'Vui lòng chọn ngày giao dự kiến.';
    }
    if (this.lines.length === 0) {
      return 'Đơn xuất hàng phải có ít nhất một dòng sản phẩm.';
    }

    for (let index = 0; index < this.lines.length; index++) {
      const line = this.lines.at(index);
      const productId = line.get('product_id')?.value;
      const quantity = Number(line.get('quantity_ordered')?.value);
      const unitPrice = Number(line.get('unit_price')?.value);
      const lineLabel = `Dòng ${index + 1}`;

      if (!productId) {
        return `${lineLabel}: vui lòng chọn sản phẩm.`;
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return `${lineLabel}: số lượng phải lớn hơn 0.`;
      }
      if (quantity > 9999999999999.99) {
        return `${lineLabel}: số lượng vượt quá giới hạn cho phép.`;
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return `${lineLabel}: đơn giá phải lớn hơn hoặc bằng 0.`;
      }
      if (unitPrice > 9999999999999.99) {
        return `${lineLabel}: đơn giá vượt quá giới hạn cho phép.`;
      }
    }

    return this.createForm.invalid ? 'Vui lòng kiểm tra lại thông tin đơn xuất hàng.' : null;
  }

  private showInsufficientStockMessage(availability?: CheckInventoryAvailabilityResponse): void {
    const product = this.products.find((item) => item.id === availability?.product_id);
    const productName = product ? `${product.name} (${product.sku})` : 'Sản phẩm đã chọn';
    const requestedQuantity = Number(availability?.requested_quantity || 0);
    const availableQuantity = Number(availability?.available_quantity || 0);

    this.toastr.warning(
      'Đơn xuất hàng',
      `${productName} chỉ còn ${availableQuantity} khả dụng, không đủ để xuất ${requestedQuantity}.`
    );
  }

  private isInventoryAvailable(availability?: CheckInventoryAvailabilityResponse): boolean {
    if (!availability) {
      return false;
    }

    return availability.is_available ?? availability.available ?? false;
  }

  selectProductFromSearch(product: ProductResponse): void {
    const emptyLine = this.lines.controls.find((line) => !line.get('product_id')?.value);
    const targetLine = emptyLine || this.addProductLine();

    targetLine.get('product_id')?.setValue(product.id);
    targetLine.get('product_id')?.markAsTouched();
    this.productSearchKeyword = '';
    this.productSearchFocused = false;
  }

  private addProductLine(): FormGroup {
    const line = this.fb.group({
      product_id: ['', Validators.required],
      quantity_ordered: [1, [Validators.required, Validators.min(0.01)]],
      unit_price: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
    this.lines.push(line);
    return line;
  }

  private normalizeSearchText(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Nháp',
      CONFIRMED: 'Đã xác nhận',
      PARTIALLY_SHIPPED: 'Giao một phần',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      DRAFT: 'badge-draft',
      CONFIRMED: 'badge-confirmed',
      PARTIALLY_SHIPPED: 'badge-progress',
      COMPLETED: 'badge-completed',
      CANCELLED: 'badge-cancelled'
    };
    return classes[status] || 'badge-default';
  }

  calculateTotal(): number {
    return this.lines.controls.reduce((total, control) => {
      const qty = Number(control.get('quantity_ordered')?.value || 0);
      const price = Number(control.get('unit_price')?.value || 0);
      return total + (qty * price);
    }, 0);
  }

  getProductName(productId: string): string {
    const product = this.products.find((item) => item.id === productId);
    return product ? `${product.sku} - ${product.name}` : productId;
  }

  getLineProductName(line: SalesOrderLineResponse): string {
    if (line.product_name) {
      return line.product_name;
    }

    return this.products.find((item) => item.id === line.product_id)?.name || 'Sản phẩm chưa xác định';
  }

  getLineProductSku(line: SalesOrderLineResponse): string {
    if (line.product_sku) {
      return line.product_sku;
    }

    return this.products.find((item) => item.id === line.product_id)?.sku || line.product_id;
  }

  getCustomerName(customerId: string): string {
    const customer = this.customers.find((item) => item.id === customerId);
    return customer ? customer.name : customerId;
  }

  getWarehouseName(warehouseId: string): string {
    const warehouse = this.warehouses.find((item) => item.id === warehouseId);
    return warehouse ? warehouse.name : warehouseId;
  }

  private getDefaultDeliveryDate(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
