import { Component, OnInit } from '@angular/core';
import { SalesOrderResponse } from '../../dto/response/SalesOrder/SalesOrderResponse';
import { SalesOrderService } from '../../service/SalesOrderService/sales-order.service';
import { BusinessPartnerService } from '../../service/BusinessPartnerService/business-partner.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { OrderStatus } from '../../helper/enums/OrderStatus';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { CreateSalesOrderRequest } from '../../dto/request/SalesOrder/SalesOrderRequest';
import { MOCK_SALES_ORDERS, MOCK_BUSINESS_PARTNERS, MOCK_WAREHOUSES, mockPage } from '../../helper/mock/mock-data';

@Component({
  selector: 'app-sales-order',
  templateUrl: './sales-order.component.html',
  styleUrls: ['./sales-order.component.css']
})
export class SalesOrderComponent implements OnInit {
  orders: SalesOrderResponse[] = [];
  customers: BusinessPartnerResponse[] = [];
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
  selectedOrder: SalesOrderResponse | null = null;
  orderToDelete: SalesOrderResponse | null = null;

  createForm: CreateSalesOrderRequest = this.initCreateForm();
  OrderStatus = OrderStatus;

  constructor(
    private soService: SalesOrderService,
    private bpService: BusinessPartnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadCustomers();
  }

  loadOrders(): void {
    this.loading = true;
    this.soService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.orders = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        const page = mockPage(MOCK_SALES_ORDERS, this.currentPage, this.pageSize);
        this.orders = page.content;
        this.totalElements = page.total_elements;
        this.totalPages = page.total_pages;
        this.loading = false;
      }
    });
  }

  loadCustomers(): void {
    this.bpService.getAll().subscribe({
      next: (res) => { if (res.success) this.customers = res.data; },
      error: () => {
        this.customers = MOCK_BUSINESS_PARTNERS;
        this.warehouses = MOCK_WAREHOUSES as any;
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
    this.soService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo đơn bán hàng thành công!');
          this.showCreateModal = false;
          this.loadOrders();
        }
      }
    });
  }

  openDetailModal(order: SalesOrderResponse): void {
    this.selectedOrder = order;
    this.showDetailModal = true;
  }

  openDeleteConfirm(order: SalesOrderResponse): void {
    this.orderToDelete = order;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.orderToDelete) return;
    this.soService.delete(this.orderToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xoá đơn bán hàng thành công!');
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

  private initCreateForm(): CreateSalesOrderRequest {
    return { customer_id: '', warehouse_id: '', currency: 'VND' };
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
}
