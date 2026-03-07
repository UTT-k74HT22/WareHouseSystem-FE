import { Component, OnInit } from '@angular/core';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { BusinessPartnerService } from '../../service/BusinessPartnerService/business-partner.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { BusinessPartnerType } from '../../helper/enums/BusinessPartnerType';
import { BusinessPartnerStatus } from '../../helper/enums/BusinessPartnerStatus';
import { CreateBusinessPartnerRequest } from '../../dto/request/BusinessPartner/CreateBusinessPartnerRequest';
import { UpdateBusinessPartnerRequest } from '../../dto/request/BusinessPartner/UpdateBusinessPartnerRequest';

@Component({
  selector: 'app-business-partner',
  templateUrl: './business-partner.component.html',
  styleUrls: ['./business-partner.component.css']
})
export class BusinessPartnerComponent implements OnInit {
  // ─── Dữ liệu ────────────────────────────────────────────────────
  partners: BusinessPartnerResponse[] = [];
  filteredPartners: BusinessPartnerResponse[] = [];

  // ─── Trạng thái ─────────────────────────────────────────────────
  loading = false;
  viewMode: 'grid' | 'list' = 'list';
  searchKeyword = '';
  selectedType: '' | BusinessPartnerType = '';
  selectedStatus: '' | BusinessPartnerStatus = '';

  // ─── Modal ───────────────────────────────────────────────────────
  showCreateModal = false;
  showEditModal = false;
  showDeleteConfirm = false;
  selectedPartner: BusinessPartnerResponse | null = null;
  partnerToDelete: BusinessPartnerResponse | null = null;

  // ─── Form ────────────────────────────────────────────────────────
  createForm: CreateBusinessPartnerRequest = this.initCreateForm();
  editForm: UpdateBusinessPartnerRequest = {};

  // ─── Enums ──────────────────────────────────────────────────────
  BusinessPartnerType = BusinessPartnerType;
  BusinessPartnerStatus = BusinessPartnerStatus;

  constructor(
    private bpService: BusinessPartnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadPartners();
  }

  loadPartners(): void {
    this.loading = true;
    this.bpService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.partners = res.data;
          this.applyFilter();
        }
        this.loading = false;
      },
      error: (error) => {
        this.partners = [];
        this.filteredPartners = [];
        this.toastr.error(error?.error?.message || 'Không tải được danh sách đối tác.');
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    this.filteredPartners = this.partners.filter(p => {
      const matchKeyword = !this.searchKeyword ||
        p.name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        p.code.toLowerCase().includes(this.searchKeyword.toLowerCase());
      const matchType = !this.selectedType || p.type === this.selectedType;
      const matchStatus = !this.selectedStatus || p.status === this.selectedStatus;
      return matchKeyword && matchType && matchStatus;
    });
  }

  onSearch(): void { this.applyFilter(); }
  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.applyFilter();
  }

  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    this.bpService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo đối tác thành công!');
          this.showCreateModal = false;
          this.loadPartners();
        }
      }
    });
  }

  openEditModal(partner: BusinessPartnerResponse): void {
    this.selectedPartner = partner;
    this.editForm = {
      name: partner.name,
      type: partner.type,
      contact_person: partner.contact_person ?? undefined,
      email: partner.email ?? undefined,
      phone: partner.phone ?? undefined,
      address: partner.address ?? undefined,
      city: partner.city ?? undefined,
      country: partner.country ?? undefined,
      tax_id: partner.tax_id ?? undefined,
      payment_terms: partner.payment_terms ?? undefined,
      credit_limit: partner.credit_limit ?? undefined,
      status: partner.status,
      notes: partner.notes ?? undefined
    };
    this.showEditModal = true;
  }

  onEditSubmit(): void {
    if (!this.selectedPartner) return;
    this.bpService.update(this.selectedPartner.id, this.editForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Cập nhật đối tác thành công!');
          this.showEditModal = false;
          this.loadPartners();
        }
      }
    });
  }

  openDeleteConfirm(partner: BusinessPartnerResponse): void {
    this.partnerToDelete = partner;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.partnerToDelete) return;
    this.bpService.delete(this.partnerToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xoá đối tác thành công!');
          this.showDeleteConfirm = false;
          this.loadPartners();
        }
      }
    });
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteConfirm = false;
    this.selectedPartner = null;
    this.partnerToDelete = null;
  }

  private initCreateForm(): CreateBusinessPartnerRequest {
    return {
      code: '',
      name: '',
      type: BusinessPartnerType.SUPPLIER,
      city: 'Vietnam',
      country: 'Vietnam',
      status: BusinessPartnerStatus.ACTIVE
    };
  }

  getTypeLabel(type: BusinessPartnerType): string {
    const labels: Record<BusinessPartnerType, string> = {
      [BusinessPartnerType.SUPPLIER]: 'Nhà cung cấp',
      [BusinessPartnerType.CUSTOMER]: 'Khách hàng',
      [BusinessPartnerType.BOTH]: 'Cả hai'
    };
    return labels[type];
  }

  getTypeClass(type: BusinessPartnerType): string {
    const classes: Record<BusinessPartnerType, string> = {
      [BusinessPartnerType.SUPPLIER]: 'badge-supplier',
      [BusinessPartnerType.CUSTOMER]: 'badge-customer',
      [BusinessPartnerType.BOTH]: 'badge-both'
    };
    return classes[type];
  }

  getStatusLabel(status: BusinessPartnerStatus): string {
    return status === BusinessPartnerStatus.ACTIVE ? 'Đang hoạt động' : 'Ngừng hoạt động';
  }

  get supplierCount(): number {
    return this.partners.filter(p =>
      p.type === BusinessPartnerType.SUPPLIER || p.type === BusinessPartnerType.BOTH).length;
  }

  get customerCount(): number {
    return this.partners.filter(p =>
      p.type === BusinessPartnerType.CUSTOMER || p.type === BusinessPartnerType.BOTH).length;
  }
}

