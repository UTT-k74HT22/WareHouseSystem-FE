import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { SalesOrderResponse } from '../../dto/response/SalesOrder/SalesOrderResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { OrderStatus } from '../../helper/enums/OrderStatus';
import { BusinessPartnerService } from '../../service/BusinessPartnerService/business-partner.service';
import { ProductService } from '../../service/ProductService/product.service';
import { SalesOrderService } from '../../service/SalesOrderService/sales-order.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';

@Component({
  selector: 'app-sales-order',
  templateUrl: './sales-order.component.html',
  styleUrls: ['./sales-order.component.css']
})
export class SalesOrderComponent implements OnInit {
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

  searchKeyword = '';
  selectedStatus: '' | OrderStatus = '';

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
    this.lines.push(this.fb.group({
      product_id: ['', Validators.required],
      quantity_ordered: [1, [Validators.required, Validators.min(0.01)]],
      unit_price: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    }));
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) {
      this.toastr.warning('Đơn hàng cần ít nhất một dòng sản phẩm.');
      return;
    }
    this.lines.removeAt(index);
  }

  loadOrders(): void {
    this.loading = true;
    const filters = {
      soNumber: this.searchKeyword.trim() || undefined,
      status: this.selectedStatus || undefined,
      sortBy: 'updatedAt',
      direction: 'DESC'
    };

    this.soService.getAll(filters, this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.orders = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
          this.calculateStats();
        }
        this.loading = false;
      },
      error: (error) => {
        this.orders = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
        this.toastr.error(error?.error?.message || 'Không thể tải danh sách đơn bán hàng.');
      }
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
    this.productService.getAll(0, 200).subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data.content.filter((product) => product.status === 'ACTIVE');
        }
      },
      error: () => {
        this.products = [];
        this.toastr.error('Không thể tải danh sách sản phẩm.');
      }
    });
  }

  calculateStats(): void {
    this.draftCount = this.orders.filter((order) => order.status === OrderStatus.DRAFT).length;
    this.confirmedCount = this.orders.filter((order) =>
      order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PARTIALLY_SHIPPED
    ).length;
    this.completedCount = this.orders.filter((order) => order.status === OrderStatus.COMPLETED).length;
    this.cancelledCount = this.orders.filter((order) => order.status === OrderStatus.CANCELLED).length;
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

  onSearch(): void {
    this.currentPage = 0;
    this.loadOrders();
  }

  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedStatus = '';
    this.currentPage = 0;
    this.loadOrders();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadOrders();
  }

  openCreateModal(): void {
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
    if (this.createForm.invalid) {
      this.toastr.warning('Vui lòng điền đầy đủ thông tin hợp lệ.');
      this.createForm.markAllAsTouched();
      return;
    }

    if (this.lines.length === 0) {
      this.toastr.warning('Đơn hàng phải có ít nhất một dòng sản phẩm.');
      return;
    }

    this.soService.create(this.createForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo đơn bán hàng thành công.');
          this.showCreateModal = false;
          this.loadOrders();
          this.openDetailModal(res.data);
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Có lỗi xảy ra khi tạo đơn bán hàng.');
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
          this.toastr.success('Xác nhận đơn hàng thành công.');
          this.selectedOrder = res.data;
          this.loadOrders();
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Xác nhận đơn hàng thất bại.');
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
          this.toastr.success('Hủy đơn hàng thành công.');
          this.showCancelConfirm = false;
          this.orderToCancel = null;
          if (this.selectedOrder?.id === orderId) {
            this.selectedOrder = res.data;
          }
          this.loadOrders();
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Hủy đơn hàng thất bại.');
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
