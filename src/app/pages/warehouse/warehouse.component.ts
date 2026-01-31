import { Component, OnInit } from '@angular/core';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';
import { WareHouseStatus } from '../../helper/enums/WareHouseStatus';
import { WareHouseType } from '../../helper/enums/WareHouseType';
import { CreateWarehouseRequest } from '../../dto/request/WareHouse/CreateWarehouseRequest';
import { UpdateWarehouseRequest } from '../../dto/request/WareHouse/UpdateWarehouseRequest';
import { ChangeStatusRequest } from '../../dto/request/WareHouse/ChangeStatusRequest';
import { ToastrService } from '../../service/SystemService/toastr.service';
import {WAREHOUSE_STATUS_LABELS, WAREHOUSE_TYPE_LABELS} from "../../helper/constraint/warehouse-labels";

@Component({
  selector: 'app-warehouse',
  templateUrl: './warehouse.component.html',
  styleUrls: ['./warehouse.component.css']
})
export class WarehouseComponent implements OnInit {

  wareHouses: WareHouseResponse[] = [];
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
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadWarehouses();
  }

  private initCreateForm(): CreateWarehouseRequest {
    return {
      code: '',
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

  private loadWarehouses(): void {
    this.loading = true;

    this.warehouseService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.wareHouses = response.data.content;
          this.totalElements = response.data.total_elements;
          this.totalPages = response.data.total_pages;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching warehouses:', error);
        this.toastr.error('Lỗi tải dữ liệu', error.error?.message || 'Có lỗi khi tải danh sách kho');
        this.loading = false;
      }
    });
  }

  // Filter and search methods
  getFilteredWarehouses(): WareHouseResponse[] {
    return this.wareHouses.filter(warehouse => {
      const matchesSearch = !this.searchTerm ||
        warehouse.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        warehouse.code.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        warehouse.address.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = !this.selectedStatus ||
        warehouse.status === this.selectedStatus;

      const matchesType = !this.selectedType ||
        warehouse.ware_house_type === this.selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  onSearch(): void {
    // Search is handled by getFilteredWarehouses()
  }

  onFilterChange(): void {
    // Filter is handled by getFilteredWarehouses()
  }

  // Statistics methods
  getActiveCount(): number {
    return this.wareHouses.filter(w => w.status === WareHouseStatus.ACTIVE).length;
  }

  getInactiveCount(): number {
    return this.wareHouses.filter(w => w.status === WareHouseStatus.INACTIVE).length;
  }

  getMaintenanceCount(): number {
    return this.wareHouses.filter(w => w.status === WareHouseStatus.UNDER_MAINTENANCE).length;
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

    this.loading = true;
    this.warehouseService.create(this.createForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Tạo kho mới thành công!');
          this.closeCreateModal();
          this.loadWarehouses();
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

    this.loading = true;
    this.warehouseService.update(this.warehouseToEdit.id, this.editForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Cập nhật kho thành công!');
          this.closeEditModal();
          this.loadWarehouses();
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
    const request: ChangeStatusRequest = {
      status: WareHouseStatus.INACTIVE
    };

    this.warehouseService.changeStatus(this.warehouseToDelete.id, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Xóa kho thành công!');
          this.closeDeleteConfirm();
          this.loadWarehouses();
        } else {
          this.toastr.error('Lỗi', response.message || 'Có lỗi khi xóa kho');
          this.loading = false;
        }
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

    const request: ChangeStatusRequest = {
      status: this.newStatus
    };

    this.loading = true;
    this.warehouseService.changeStatus(this.warehouseToChangeStatus.id, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Thay đổi trạng thái thành công!');
          this.closeStatusChangeModal();
          this.loadWarehouses();
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

  // Validation methods
  private validateCreateForm(): boolean {
    if (!this.createForm.code.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập mã kho');
      return false;
    }
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
    if (!this.createForm.email.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập email');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.createForm.email)) {
      this.toastr.warning('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email');
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
    if (!this.editForm.email.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập email');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editForm.email)) {
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
