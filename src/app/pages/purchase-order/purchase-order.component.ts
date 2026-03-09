import { Component, OnInit } from '@angular/core';
import { PurchaseOrderResponse } from '../../dto/response/PurchaseOrder/PurchaseOrderResponse';
import { PurchaseOrderService } from '../../service/PurchaseOrderService/purchase-order.service';
import { BusinessPartnerService } from '../../service/BusinessPartnerService/business-partner.service';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { OrderStatus } from '../../helper/enums/OrderStatus';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { CreatePurchaseOrderRequest } from '../../dto/request/PurchaseOrder/PurchaseOrderRequest';
import { PurchaseOrderFilters } from '../../service/PurchaseOrderService/purchase-order.service';

@Component({
  selector: 'app-purchase-order',
  templateUrl: './purchase-order.component.html',
  styleUrls: ['./purchase-order.component.css']
})
export class PurchaseOrderComponent implements OnInit {
  orders: PurchaseOrderResponse[] = [];
  suppliers: BusinessPartnerResponse[] = [];
  warehouses: WareHouseResponse[] = [];

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
  showDeleteConfirm = false;
  selectedOrder: PurchaseOrderResponse | null = null;
  orderToDelete: PurchaseOrderResponse | null = null;

  createForm: CreatePurchaseOrderRequest = this.initCreateForm();

  OrderStatus = OrderStatus;

  constructor(
    private poService: PurchaseOrderService,
    private bpService: BusinessPartnerService,
    private warehouseService: WarehouseService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadSuppliers();
    this.loadWarehouses();
  }

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
        this.toastr.error(error?.error?.message || 'Không tải được danh sách purchase order.');
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

  onSearch(): void { this.currentPage = 0; this.loadOrders(); }
  onResetFilter(): void { this.searchKeyword = ''; this.selectedStatus = ''; this.loadOrders(); }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadOrders();
  }

  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    this.poService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo đơn mua hàng thành công!');
          this.showCreateModal = false;
          this.loadOrders();
        }
      }
    });
  }

  openDetailModal(order: PurchaseOrderResponse): void {
    this.selectedOrder = order;
    this.showDetailModal = true;
  }

  openDeleteConfirm(order: PurchaseOrderResponse): void {
    this.orderToDelete = order;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.orderToDelete) return;
    this.poService.delete(this.orderToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xoá đơn hàng thành công!');
          this.showDeleteConfirm = false;
          this.loadOrders();
        }
      }
    });
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showDetailModal = false;
    this.showDeleteConfirm = false;
    this.selectedOrder = null;
    this.orderToDelete = null;
  }

  private initCreateForm(): CreatePurchaseOrderRequest {
    return {
      supplier_id: '',
      warehouse_id: '',
      order_date: new Date().toISOString().slice(0, 10),
      currency: 'VND',
    };
  }

  confirmOrder(order: PurchaseOrderResponse): void {
    this.poService.confirm(order.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã xác nhận đơn mua hàng.');
          this.orders = this.orders.map((item) => item.id === order.id ? this.enrichOrder(res.data) : item);
          if (this.selectedOrder?.id === order.id) {
            this.selectedOrder = this.enrichOrder(res.data);
          }
          this.loadOrders();
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Xác nhận đơn mua hàng thất bại.');
      }
    });
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

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.DRAFT]: 'Nháp',
      [OrderStatus.CONFIRMED]: 'Đã xác nhận',
      [OrderStatus.PARTIALLY_RECEIVED]: 'Nhận một phần',
      [OrderStatus.IN_PROGRESS]: 'Đang xử lý',
      [OrderStatus.COMPLETED]: 'Hoàn thành',
      [OrderStatus.CANCELLED]: 'Đã huỷ'
    };
    return labels[status];
  }

  getStatusClass(status: OrderStatus): string {
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

  getDraftCount(): number { return this.orders.filter(o => o.status === OrderStatus.DRAFT).length; }
  getCompletedCount(): number { return this.orders.filter(o => o.status === OrderStatus.COMPLETED).length; }
}

