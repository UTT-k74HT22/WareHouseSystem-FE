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
import { MOCK_PURCHASE_ORDERS, MOCK_BUSINESS_PARTNERS, MOCK_WAREHOUSES, mockPage } from '../../helper/mock/mock-data';

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
    this.poService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.orders = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        const page = mockPage(MOCK_PURCHASE_ORDERS, this.currentPage, this.pageSize);
        this.orders = page.content;
        this.totalElements = page.total_elements;
        this.totalPages = page.total_pages;
        this.loading = false;
      }
    });
  }

  loadSuppliers(): void {
    this.bpService.getAll().subscribe({
      next: (res) => { if (res.success) this.suppliers = res.data; },
      error: () => { this.suppliers = MOCK_BUSINESS_PARTNERS; }
    });
  }

  loadWarehouses(): void {
    this.warehouseService.getList().subscribe({
      next: (res) => { if (res.success) this.warehouses = res.data; },
      error: () => { this.warehouses = MOCK_WAREHOUSES as any; }
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
    return { supplier_id: '', warehouse_id: '', currency: 'VND' };
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.DRAFT]: 'Nháp',
      [OrderStatus.CONFIRMED]: 'Đã xác nhận',
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
      [OrderStatus.IN_PROGRESS]: 'badge-progress',
      [OrderStatus.COMPLETED]: 'badge-completed',
      [OrderStatus.CANCELLED]: 'badge-cancelled'
    };
    return classes[status];
  }

  getDraftCount(): number { return this.orders.filter(o => o.status === OrderStatus.DRAFT).length; }
  getCompletedCount(): number { return this.orders.filter(o => o.status === OrderStatus.COMPLETED).length; }
}
