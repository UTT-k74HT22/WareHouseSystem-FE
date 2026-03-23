import { Component, OnInit } from '@angular/core';
import { OutboundShipmentResponse } from '../../dto/response/OutboundShipment/OutboundShipmentResponse';
import { OutboundService } from '../../service/OutboundService/outbound.service';
import { BusinessPartnerService } from '../../service/BusinessPartnerService/business-partner.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { OutboundShipmentStatus } from '../../helper/enums/OutboundShipmentStatus';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { CreateOutboundShipmentRequest } from '../../dto/request/OutboundShipment/OutboundShipmentRequest';

@Component({
  selector: 'app-outbound',
  templateUrl: './outbound.component.html',
  styleUrls: ['./outbound.component.css']
})
export class OutboundComponent implements OnInit {
  readonly backendReady = false;

  shipments: OutboundShipmentResponse[] = [];
  customers: BusinessPartnerResponse[] = [];
  warehouses: WareHouseResponse[] = [];

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';

  searchKeyword = '';
  selectedStatus: '' | OutboundShipmentStatus = '';

  showCreateModal = false;
  showDetailModal = false;
  showDeleteConfirm = false;
  selectedShipment: OutboundShipmentResponse | null = null;
  shipmentToDelete: OutboundShipmentResponse | null = null;

  createForm: CreateOutboundShipmentRequest = this.initCreateForm();
  OutboundShipmentStatus = OutboundShipmentStatus;

  constructor(
    private outboundService: OutboundService,
    private bpService: BusinessPartnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadDropdowns();
  }

  loadShipments(): void {
    this.shipments = [];
    this.totalElements = 0;
    this.totalPages = 0;
    this.loading = false;
  }

  loadDropdowns(): void {
    this.bpService.getAll().subscribe({
      next: (res) => { if (res.success) this.customers = res.data; },
      error: () => {
        this.customers = [];
        this.warehouses = [];
      }
    });
  }

  onSearch(): void { this.currentPage = 0; this.loadShipments(); }
  onResetFilter(): void { this.searchKeyword = ''; this.selectedStatus = ''; this.loadShipments(); }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadShipments();
  }

  openCreateModal(): void {
    if (!this.backendReady) {
      this.toastr.info('Outbound shipment API chưa được backend triển khai.');
      return;
    }
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    this.outboundService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo phiếu xuất thành công!');
          this.showCreateModal = false;
          this.loadShipments();
        }
      }
    });
  }

  openDetailModal(shipment: OutboundShipmentResponse): void {
    if (!this.backendReady) {
      this.toastr.info('Outbound shipment API chưa được backend triển khai.');
      return;
    }
    this.selectedShipment = shipment;
    this.showDetailModal = true;
  }

  openDeleteConfirm(shipment: OutboundShipmentResponse): void {
    if (!this.backendReady) {
      this.toastr.info('Outbound shipment API chưa được backend triển khai.');
      return;
    }
    this.shipmentToDelete = shipment;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.shipmentToDelete) return;
    this.outboundService.delete(this.shipmentToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xoá phiếu xuất thành công!');
          this.showDeleteConfirm = false;
          this.loadShipments();
        }
      }
    });
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showDetailModal = false;
    this.showDeleteConfirm = false;
    this.selectedShipment = null;
    this.shipmentToDelete = null;
  }

  private initCreateForm(): CreateOutboundShipmentRequest {
    return { customer_id: '', warehouse_id: '' };
  }

  getStatusLabel(status: OutboundShipmentStatus): string {
    const labels: Record<OutboundShipmentStatus, string> = {
      [OutboundShipmentStatus.PENDING]: 'Chờ xử lý',
      [OutboundShipmentStatus.PICKING]: 'Đang lấy hàng',
      [OutboundShipmentStatus.PACKING]: 'Đang đóng gói',
      [OutboundShipmentStatus.SHIPPED]: 'Đã giao vận',
      [OutboundShipmentStatus.DELIVERED]: 'Đã giao hàng',
      [OutboundShipmentStatus.CANCELLED]: 'Đã huỷ'
    };
    return labels[status];
  }

  getStatusClass(status: OutboundShipmentStatus): string {
    const classes: Record<OutboundShipmentStatus, string> = {
      [OutboundShipmentStatus.PENDING]: 'badge-pending',
      [OutboundShipmentStatus.PICKING]: 'badge-picking',
      [OutboundShipmentStatus.PACKING]: 'badge-packing',
      [OutboundShipmentStatus.SHIPPED]: 'badge-shipped',
      [OutboundShipmentStatus.DELIVERED]: 'badge-delivered',
      [OutboundShipmentStatus.CANCELLED]: 'badge-cancelled'
    };
    return classes[status];
  }
}

