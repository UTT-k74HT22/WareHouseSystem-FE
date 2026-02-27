import { Component, OnInit } from '@angular/core';
import { InboundReceiptResponse } from '../../dto/response/InboundReceipt/InboundReceiptResponse';
import { InboundService } from '../../service/InboundService/inbound.service';
import { BusinessPartnerService } from '../../service/BusinessPartnerService/business-partner.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { InboundReceiptStatus } from '../../helper/enums/InboundReceiptStatus';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { CreateInboundReceiptRequest } from '../../dto/request/InboundReceipt/InboundReceiptRequest';
import { MOCK_INBOUND_RECEIPTS, MOCK_BUSINESS_PARTNERS, MOCK_WAREHOUSES, mockPage } from '../../helper/mock/mock-data';

@Component({
  selector: 'app-inbound',
  templateUrl: './inbound.component.html',
  styleUrls: ['./inbound.component.css']
})
export class InboundComponent implements OnInit {
  receipts: InboundReceiptResponse[] = [];
  suppliers: BusinessPartnerResponse[] = [];
  warehouses: WareHouseResponse[] = [];

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;

  searchKeyword = '';
  selectedStatus: '' | InboundReceiptStatus = '';

  showCreateModal = false;
  showDetailModal = false;
  showDeleteConfirm = false;
  selectedReceipt: InboundReceiptResponse | null = null;
  receiptToDelete: InboundReceiptResponse | null = null;

  createForm: CreateInboundReceiptRequest = this.initCreateForm();
  InboundReceiptStatus = InboundReceiptStatus;

  constructor(
    private inboundService: InboundService,
    private bpService: BusinessPartnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadReceipts();
    this.loadDropdowns();
  }

  loadReceipts(): void {
    this.loading = true;
    this.inboundService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.receipts = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        const page = mockPage(MOCK_INBOUND_RECEIPTS, this.currentPage, this.pageSize);
        this.receipts = page.content;
        this.totalElements = page.total_elements;
        this.totalPages = page.total_pages;
        this.loading = false;
      }
    });
  }

  loadDropdowns(): void {
    this.bpService.getAll().subscribe({
      next: (res) => { if (res.success) this.suppliers = res.data; },
      error: () => {
        this.suppliers = MOCK_BUSINESS_PARTNERS;
        this.warehouses = MOCK_WAREHOUSES as any;
      }
    });
  }

  onSearch(): void { this.currentPage = 0; this.loadReceipts(); }
  onResetFilter(): void { this.searchKeyword = ''; this.selectedStatus = ''; this.loadReceipts(); }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadReceipts();
  }

  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    this.inboundService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo phiếu nhập thành công!');
          this.showCreateModal = false;
          this.loadReceipts();
        }
      }
    });
  }

  openDetailModal(receipt: InboundReceiptResponse): void {
    this.selectedReceipt = receipt;
    this.showDetailModal = true;
  }

  openDeleteConfirm(receipt: InboundReceiptResponse): void {
    this.receiptToDelete = receipt;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.receiptToDelete) return;
    this.inboundService.delete(this.receiptToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xoá phiếu nhập thành công!');
          this.showDeleteConfirm = false;
          this.loadReceipts();
        }
      }
    });
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showDetailModal = false;
    this.showDeleteConfirm = false;
    this.selectedReceipt = null;
    this.receiptToDelete = null;
  }

  private initCreateForm(): CreateInboundReceiptRequest {
    return { supplier_id: '', warehouse_id: '' };
  }

  getStatusLabel(status: InboundReceiptStatus): string {
    const labels: Record<InboundReceiptStatus, string> = {
      [InboundReceiptStatus.PENDING]: 'Chờ xử lý',
      [InboundReceiptStatus.IN_PROGRESS]: 'Đang nhận',
      [InboundReceiptStatus.COMPLETED]: 'Hoàn thành',
      [InboundReceiptStatus.CANCELLED]: 'Đã huỷ'
    };
    return labels[status];
  }

  getStatusClass(status: InboundReceiptStatus): string {
    const classes: Record<InboundReceiptStatus, string> = {
      [InboundReceiptStatus.PENDING]: 'badge-pending',
      [InboundReceiptStatus.IN_PROGRESS]: 'badge-progress',
      [InboundReceiptStatus.COMPLETED]: 'badge-completed',
      [InboundReceiptStatus.CANCELLED]: 'badge-cancelled'
    };
    return classes[status];
  }
}
