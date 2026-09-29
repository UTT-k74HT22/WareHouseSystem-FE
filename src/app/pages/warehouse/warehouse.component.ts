import { Component, OnInit } from '@angular/core';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';
import { WareHouseStatus } from '../../helper/enums/WareHouseStatus';
import { WareHouseType } from '../../helper/enums/WareHouseType';
import { CreateWarehouseRequest, UpdateWarehouseRequest } from '../../dto/request/WareHouse/WarehouseRequest';
import { ToastrService } from '../../service/SystemService/toastr.service';
import {WAREHOUSE_STATUS_LABELS, WAREHOUSE_TYPE_LABELS} from "../../helper/constraint/warehouse-labels";
import {AccountResponse} from "../../dto/response/Account/AccountResponse";
import {AccountService} from "../../service/Account/account.service";

@Component({
  selector: 'app-warehouse',
  templateUrl: './warehouse.component.html',
  styleUrls: ['./warehouse.component.css']
})
export class WarehouseComponent implements OnInit {
  readonly createPermissions = ['PERM_WAREHOUSE_CREATE'];
  readonly updatePermissions = ['PERM_WAREHOUSE_UPDATE'];
  readonly deletePermissions = ['PERM_WAREHOUSE_DELETE'];
  readonly exportPermissions = ['PERM_WAREHOUSE_READ'];

  wareHouses: WareHouseResponse[] = [];
  accountManagers: AccountResponse[] = [];
  selectedWarehouse: WareHouseResponse | null = null;
  loading: boolean = false;
  viewMode: 'grid' | 'list' = 'grid';
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;

// Filter properties
  searchTerm: string = '';
  selectedStatus: '' | WareHouseStatus = '';
  selectedType: '' | WareHouseType = '';

  // Modal states
  showCreateModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteConfirm: boolean = false;
  showStatusChangeModal: boolean = false;
  warehouseToDelete: WareHouseResponse | null = null;
  warehouseToEdit: WareHouseResponse | null = null;
  warehouseToChangeStatus: WareHouseResponse | null = null;

  // Form models
  createForm: CreateWarehouseRequest = this.initCreateForm();
  editForm: UpdateWarehouseRequest = this.initEditForm();
  newStatus: WareHouseStatus = WareHouseStatus.ACTIVE;

  // Enums for templates
  WareHouseStatus = WareHouseStatus;
  WareHouseType = WareHouseType;

  constructor(
    private warehouseService: WarehouseService,
    private accountService: AccountService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadWarehouses();
    this.loadAccountManagers();
    this.loadStats();
  }

  private initCreateForm(): CreateWarehouseRequest {
    return {
      name: '',
      address: '',
      phone: '',
      email: '',
      ware_house_type: WareHouseType.MAIN,
      status: WareHouseStatus.ACTIVE,
      manager_id: ''
    };
  }

  private initEditForm(): UpdateWarehouseRequest {
    return {
      name: '',
      address: '',
      phone: '',
      email: '',
      ware_house_type: WareHouseType.MAIN,
      manager_id: ''
    };
  }

  private loadWarehouses(silent = false): void {
    // silent = true khi gõ search/đổi filter: giữ bảng cũ, không flash spinner, không unmount input
    if (!silent) {
      this.loading = true;
    }
    const seq = ++this.loadSeq;

    this.warehouseService.getAll(this.currentPage, this.pageSize, this.searchTerm, this.selectedStatus, this.selectedType)
      .subscribe({
      next: (response) => {
        if (seq !== this.loadSeq) {
          return; // response cũ về sau thì bỏ qua
        }
        if (response.success && response.data) {
          this.wareHouses = response.data.content;
          this.totalElements = response.data.total_elements;
          this.totalPages = response.data.total_pages;
        }
        this.loading = false;
      },
      error: (error) => {
        if (seq !== this.loadSeq) {
          return;
        }
        console.error('Error fetching warehouses:', error);
        this.toastr.error('Lỗi tải dữ liệu', error.error?.message || 'Có lỗi khi tải danh sách kho');
        this.loading = false;
      }
    });
  }

  private loadAccountManagers(): void {
    this.accountService.getUserByRoleManager().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.accountManagers = response.data;
        }
      },
      error: (error) => {
        console.error('Error fetching account managers:', error);
        this.toastr.error('Lỗi tải dữ liệu', error.error?.message || 'Có lỗi khi tải danh sách quản lý');
      }
    })
  }

  // Filter and search methods (server-side via GET /warehouse?keyword&status&type)
  getFilteredWarehouses(): WareHouseResponse[] {
    return this.wareHouses;
  }

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private loadSeq = 0;

  onSearch(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.currentPage = 0;
      this.loadWarehouses(true);
    }, 500);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadWarehouses(true);
  }

  // Statistics methods (global counts from /warehouse/stats)
  statsActive = 0;
  statsInactive = 0;
  statsMaintenance = 0;

  private loadStats(): void {
    this.warehouseService.getStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.statsActive = response.data.active;
          this.statsInactive = response.data.inactive;
          this.statsMaintenance = response.data.maintenance;
        }
      },
      error: (error) => {
        console.error('Error fetching warehouse stats:', error);
      }
    });
  }

  // Label helpers
  getStatusLabel(status: WareHouseStatus | undefined): string {
    if (!status) return 'Không xác định';
    return WAREHOUSE_STATUS_LABELS[status] ?? 'Không xác định';
  }

  getTypeLabel(type: WareHouseType | undefined): string {
    if (!type) return 'Không xác định';
    return WAREHOUSE_TYPE_LABELS[type] ?? 'Không xác định';
  }

  // CRUD operations
  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createForm = this.initCreateForm();
  }

  submitCreate(): void {
    if (!this.validateCreateForm()) {
      return;
    }

    const payload: CreateWarehouseRequest = {
      ...this.createForm,
      name: this.createForm.name.trim(),
      address: this.createForm.address.trim(),
      phone: this.createForm.phone.trim(),
      email: this.createForm.email.trim(),
      manager_id: this.createForm.manager_id?.trim()
    };

    this.loading = true;
    this.warehouseService.create(payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Tạo kho mới thành công!');
          this.closeCreateModal();
          this.loadWarehouses();
          this.loadStats();
        } else {
          this.toastr.error('Lỗi', response.message || 'Có lỗi khi tạo kho');
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error creating warehouse:', error);
        this.toastr.error('Lỗi', error.error?.message || 'Có lỗi khi tạo kho');
        this.loading = false;
      }
    });
  }

  openEditModal(warehouse: WareHouseResponse): void {
    this.warehouseToEdit = warehouse;
    this.editForm = {
      name: warehouse.name,
      address: warehouse.address,
      phone: warehouse.phone,
      email: warehouse.email,
      ware_house_type: warehouse.ware_house_type,
      manager_id: warehouse.manager_id || ''
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.warehouseToEdit = null;
    this.editForm = this.initEditForm();
  }

  submitEdit(): void {
    if (!this.warehouseToEdit || !this.validateEditForm()) {
      return;
    }

    const payload: UpdateWarehouseRequest = {
      ...this.editForm,
      name: this.editForm.name.trim(),
      address: this.editForm.address.trim(),
      phone: this.editForm.phone.trim(),
      email: this.editForm.email.trim(),
      manager_id: this.editForm.manager_id?.trim() ? this.editForm.manager_id.trim() : undefined
    };

    this.loading = true;
    this.warehouseService.update(this.warehouseToEdit.id, payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Cập nhật kho thành công!');
          this.closeEditModal();
          this.loadWarehouses();
          this.loadStats();
        } else {
          this.toastr.error('Lỗi', response.message || 'Có lỗi khi cập nhật kho');
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error updating warehouse:', error);
        this.toastr.error('Lỗi', error.error?.message || 'Có lỗi khi cập nhật kho');
        this.loading = false;
      }
    });
  }

  openDeleteConfirm(warehouse: WareHouseResponse): void {
    this.warehouseToDelete = warehouse;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.warehouseToDelete = null;
  }

  confirmDelete(): void {
    if (!this.warehouseToDelete) {
      return;
    }

    this.loading = true;

    this.warehouseService.delete(this.warehouseToDelete.id).subscribe({
      next: () => {
        this.toastr.success('Thành công', 'Xóa kho thành công!');
          this.closeDeleteConfirm();
          this.loadWarehouses();
          this.loadStats();
      },
      error: (error) => {
        console.error('Error deleting warehouse:', error);
        this.toastr.error('Lỗi', error.error?.message || 'Có lỗi khi xóa kho');
        this.loading = false;
      }
    });
  }

  openStatusChangeModal(warehouse: WareHouseResponse): void {
    this.warehouseToChangeStatus = warehouse;
    this.newStatus = warehouse.status;
    this.showStatusChangeModal = true;
  }

  closeStatusChangeModal(): void {
    this.showStatusChangeModal = false;
    this.warehouseToChangeStatus = null;
  }

  submitStatusChange(): void {
    if (!this.warehouseToChangeStatus) {
      return;
    }
    if (this.newStatus === this.warehouseToChangeStatus.status) {
      this.toastr.warning('Không thay đổi', 'Trạng thái mới giống trạng thái hiện tại');
      return;
    }

    // PATCH /{id}/status chỉ cần status; các field PUT bắt buộc không áp dụng ở đây
    const request = {
      status: this.newStatus
    } as unknown as UpdateWarehouseRequest;

    this.loading = true;
    this.warehouseService.changeStatus(this.warehouseToChangeStatus.id, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Thay đổi trạng thái thành công!');
          this.closeStatusChangeModal();
          this.loadWarehouses();
          this.loadStats();
        } else {
          this.toastr.error('Lỗi', response.message || 'Có lỗi khi thay đổi trạng thái');
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error changing status:', error);
        this.toastr.error('Lỗi', error.error?.message || 'Có lỗi khi thay đổi trạng thái');
        this.loading = false;
      }
    });
  }

  viewDetails(warehouse: WareHouseResponse): void {
    this.selectedWarehouse = warehouse;
  }

  closeDetails(): void {
    this.selectedWarehouse = null;
  }

  // Validation methods (đồng bộ với BE: phone ^(0\d{9}|\+84\d{9})$)
  private readonly phoneRegex = /^(0\d{9}|\+84\d{9})$/;

  private validateCreateForm(): boolean {
    // if (!this.createForm.code.trim()) {
    //   this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập mã kho');
    //   return false;
    // }
    if (!this.createForm.name.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập tên kho');
      return false;
    }
    if (!this.createForm.address.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập địa chỉ');
      return false;
    }
    if (!this.createForm.phone.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập số điện thoại');
      return false;
    }
    if (!this.phoneRegex.test(this.createForm.phone.trim())) {
      this.toastr.warning('Số điện thoại không hợp lệ', 'Nhập 10 số bắt đầu bằng 0 hoặc +84 kèm 9 số');
      return false;
    }
    if (!this.createForm.email.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập email');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.createForm.email.trim())) {
      this.toastr.warning('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email');
      return false;
    }
    if (!this.createForm.manager_id?.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng chọn quản lý kho');
      return false;
    }
    return true;
  }

  private validateEditForm(): boolean {
    if (!this.editForm.name.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập tên kho');
      return false;
    }
    if (!this.editForm.address.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập địa chỉ');
      return false;
    }
    if (!this.editForm.phone.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập số điện thoại');
      return false;
    }
    if (!this.phoneRegex.test(this.editForm.phone.trim())) {
      this.toastr.warning('Số điện thoại không hợp lệ', 'Nhập 10 số bắt đầu bằng 0 hoặc +84 kèm 9 số');
      return false;
    }
    if (!this.editForm.email.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập email');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editForm.email.trim())) {
      this.toastr.warning('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email');
      return false;
    }
    return true;
  }

  //BUILD FUNCTION FOR PAGINATION

  // Function to handle page change
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadWarehouses();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadWarehouses();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadWarehouses();
    }
  }

  // Helper method to get all enum values
  getStatusOptions(): WareHouseStatus[] {
    return Object.values(WareHouseStatus);
  }

  getTypeOptions(): WareHouseType[] {
    return Object.values(WareHouseType);
  }
}
