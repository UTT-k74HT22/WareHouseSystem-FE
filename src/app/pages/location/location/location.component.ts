import { Component, OnInit } from '@angular/core';
import { LocationResponse } from '../../../dto/response/Location/LocationResponse';
import { LocationService } from '../../../service/Location/location.service';
import { LocationStatus } from '../../../helper/enums/LocationStatus';
import { LocationType } from '../../../helper/enums/LocationType';
import { CreateLocationRequest, UpdateLocationRequest } from '../../../dto/request/Location/LocationRequest';
import { SearchLocationRequest } from '../../../dto/request/Location/SearchLocationRequest';
import { ToastrService } from '../../../service/SystemService/toastr.service';
import { LOCATION_STATUS_LABELS, LOCATION_TYPE_LABELS } from '../../../helper/constraint/location-labels';
import {WareHouseResponse} from "../../../dto/response/WareHouse/WareHouseResponse";
import {WarehouseService} from "../../../service/WarehouseService/warehouse.service";
import {AccountService} from "../../../service/Account/account.service";
import {AccountResponse} from "../../../dto/response/Account/AccountResponse";

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.css']
})
export class LocationComponent implements OnInit {
  readonly createPermissions = ['PERM_LOCATION_CREATE'];
  readonly updatePermissions = ['PERM_LOCATION_UPDATE'];
  readonly deletePermissions = ['PERM_LOCATION_DELETE'];
  readonly exportPermissions = ['PERM_LOCATION_READ'];

  locations: LocationResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  account: AccountResponse | null = null;
  selectedLocation: LocationResponse | null = null;
  loading: boolean = false;
  viewMode: 'grid' | 'list' = 'grid';
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;

  // Filter properties (server-side via GET /locations with optional filters)
  searchTerm: string = '';
  selectedWarehouseId: string = '';
  selectedStatus: '' | LocationStatus = '';
  selectedType: '' | LocationType = '';

  // Modal states
  showCreateModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteConfirm: boolean = false;
  showStatusChangeModal: boolean = false;
  locationToDelete: LocationResponse | null = null;
  locationToEdit: LocationResponse | null = null;
  locationToChangeStatus: LocationResponse | null = null;

  // Form models
  createForm: CreateLocationRequest = this.initCreateForm();
  editForm: UpdateLocationRequest = this.initEditForm();
  newStatus: LocationStatus = LocationStatus.ACTIVE;
  statusChangeReason: string = '';

  // Enums for templates
  LocationStatus = LocationStatus;
  LocationType = LocationType;

  constructor(
    private locationService: LocationService,
    private wareHouseService: WarehouseService,
    private accountService: AccountService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadLocations();
    this.loadWareHouses();
    this.loadStats();
  }

  private initCreateForm(): CreateLocationRequest {
    return {
      warehouse_id: '',
      name: '',
      zone: '',
      type: LocationType.STORAGE,
      capacity: 0,
      status: LocationStatus.ACTIVE,
      notes: ''
    };
  }

  private initEditForm(): UpdateLocationRequest {
    return {
      name: '',
      zone: '',
      type: LocationType.STORAGE,
      capacity: 0,
      notes: ''
    };
  }

  loadLocations(silent = false): void {
    // silent = true khi gõ search/đổi filter: giữ bảng cũ, không flash spinner, không unmount input
    if (!silent) {
      this.loading = true;
    }
    const seq = ++this.loadSeq;

    const request: SearchLocationRequest = {};
    if (this.searchTerm?.trim()) {
      request.keyword = this.searchTerm.trim();
    }
    if (this.selectedWarehouseId) {
      request.warehouse_id = this.selectedWarehouseId;
    }
    if (this.selectedStatus) {
      request.status = this.selectedStatus;
    }
    if (this.selectedType) {
      request.type = this.selectedType;
    }

    this.locationService.getAll(this.currentPage, this.pageSize, request).subscribe({
      next: (response) => {
        if (seq !== this.loadSeq) {
          return; // response cũ về sau thì bỏ qua
        }
        if (response.success && response.data) {
          this.locations = response.data.content;
          this.totalElements = response.data.total_elements;
          this.totalPages = response.data.total_pages;
        }
        this.loading = false;
      },
      error: (error) => {
        if (seq !== this.loadSeq) {
          return;
        }
        console.error('Error fetching locations:', error);
        this.toastr.error('Lỗi tải dữ liệu', error.error?.message || 'Có lỗi khi tải danh sách vị trí');
        this.loading = false;
      }
    });
  }

  loadCreatorInfo(createdById: string): void {
    this.accountService.getUserById(createdById).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.account = response.data;
        }
      },
      error: (error) => {
        console.error('Error fetching creator info:', error);
      }
    });
  }

  // Filter and search methods (server-side via GET /locations with optional filters)
  getFilteredLocations(): LocationResponse[] {
    return this.locations;
  }

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private loadSeq = 0;

  onSearch(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.currentPage = 0;
      this.loadLocations(true);
    }, 500);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadLocations(true);
  }

  // Statistics methods (global counts from /locations/stats)
  statsActive = 0;
  statsInactive = 0;
  statsFull = 0;
  statsMaintenance = 0;

  private loadStats(): void {
    this.locationService.getStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.statsActive = response.data.active;
          this.statsInactive = response.data.inactive;
          this.statsFull = response.data.full;
          this.statsMaintenance = response.data.maintenance;
        }
      },
      error: (error) => {
        console.error('Error fetching location stats:', error);
      }
    });
  }

  // Label helpers
  getStatusLabel(status: LocationStatus | undefined): string {
    if (!status) return 'Không xác định';
    return LOCATION_STATUS_LABELS[status] ?? 'Không xác định';
  }

  getTypeLabel(type: LocationType | undefined): string {
    if (!type) return 'Không xác định';
    return LOCATION_TYPE_LABELS[type] ?? 'Không xác định';
  }

  getStatusClass(status: LocationStatus): string {
    switch (status) {
      case LocationStatus.ACTIVE:
        return 'status-active';
      case LocationStatus.INACTIVE:
        return 'status-inactive';
      case LocationStatus.FULL:
        return 'status-full';
      case LocationStatus.MAINTENANCE:
        return 'status-maintenance';
      default:
        return '';
    }
  }

  // Pagination methods
  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadLocations();
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadLocations();
  }

  // View mode methods
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  // Detail view
  viewDetails(location: LocationResponse): void {
    this.selectedLocation = location;
    if (location.created_by) {
      this.loadCreatorInfo(location.created_by);
    }
  }

  closeDetails(): void {
    this.selectedLocation = null;
  }

  // Create methods
  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.loadWareHouses();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createForm = this.initCreateForm();
  }

  onSubmitCreate(): void {
    if (!this.createForm.warehouse_id) {
      this.toastr.error('Vị trí', 'Vui lòng chọn kho.');
      return;
    }
    if (!this.createForm.name?.trim()) {
      this.toastr.error('Vị trí', 'Vui lòng nhập tên vị trí.');
      return;
    }
    if (this.createForm.capacity == null || Number(this.createForm.capacity) <= 0) {
      this.toastr.error('Vị trí', 'Sức chứa phải lớn hơn 0.');
      return;
    }
    this.loading = true;

    this.locationService.create(this.createForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Tạo vị trí mới thành công');
          this.closeCreateModal();
          this.loadLocations();
          this.loadStats();
        }
      },
      error: (error) => {
        console.error('Error creating location:', error);
        this.toastr.error('Lỗi', error.error?.message || 'Có lỗi khi tạo vị trí');
        this.loading = false;
      }
    });
  }

  // Edit methods
  openEditModal(location: LocationResponse): void {
    this.locationToEdit = location;
    this.editForm = {
      name: location.name,
      zone: location.zone,
      type: location.type,
      capacity: location.capacity,
      notes: location.notes
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.locationToEdit = null;
    this.editForm = this.initEditForm();
  }

  onSubmitEdit(): void {
    if (!this.locationToEdit) return;

    if (!this.editForm.name?.trim()) {
      this.toastr.error('Vị trí', 'Vui lòng nhập tên vị trí.');
      return;
    }
    if (this.editForm.capacity == null || Number(this.editForm.capacity) <= 0) {
      this.toastr.error('Vị trí', 'Sức chứa phải lớn hơn 0.');
      return;
    }
    if (Number(this.editForm.capacity) < Number(this.locationToEdit.used_capacity || 0)) {
      this.toastr.error('Vị trí', 'Sức chứa mới không được nhỏ hơn lượng đã dùng.');
      return;
    }

    this.loading = true;

    this.locationService.update(this.locationToEdit.id, {
      ...this.editForm,
      name: this.editForm.name.trim(),
      zone: this.editForm.zone?.trim()
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Cập nhật vị trí thành công');
          this.closeEditModal();
          this.loadLocations();
          this.loadStats();
        }
      },
      error: (error) => {
        console.error('Error updating location:', error);
        this.toastr.error('Lỗi', error.error?.message || 'Có lỗi khi cập nhật vị trí');
        this.loading = false;
      }
    });
  }

  // Status change methods
  openStatusChangeModal(location: LocationResponse): void {
    this.locationToChangeStatus = location;
    this.newStatus = location.status;
    this.statusChangeReason = '';
    this.showStatusChangeModal = true;
  }

  closeStatusChangeModal(): void {
    this.showStatusChangeModal = false;
    this.locationToChangeStatus = null;
    this.statusChangeReason = '';
  }

  onSubmitStatusChange(): void {
    if (!this.locationToChangeStatus) return;

    if (this.newStatus === this.locationToChangeStatus.status) {
      this.toastr.warning('Không thay đổi', 'Trạng thái mới giống trạng thái hiện tại');
      return;
    }

    this.loading = true;

    const request: UpdateLocationRequest = {
      status: this.newStatus,
      reason: this.statusChangeReason
    };

    this.locationService.changeStatus(this.locationToChangeStatus.id, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Thay đổi trạng thái vị trí thành công');
          this.closeStatusChangeModal();
          this.loadLocations();
          this.loadStats();
        }
      },
      error: (error) => {
        console.error('Error changing location status:', error);
        this.toastr.error('Lỗi', error.error?.message || 'Có lỗi khi thay đổi trạng thái vị trí');
        this.loading = false;
      }
    });
  }

  // Delete methods
  openDeleteConfirm(location: LocationResponse): void {
    this.locationToDelete = location;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.locationToDelete = null;
  }

  onConfirmDelete(): void {
    if (!this.locationToDelete) return;

    this.loading = true;

    this.locationService.delete(this.locationToDelete.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Xóa vị trí thành công');
          this.closeDeleteConfirm();
          this.loadLocations();
          this.loadStats();
        }
      },
      error: (error) => {
        console.error('Error deleting location:', error);
        this.toastr.error('Lỗi', error.error?.message || 'Có lỗi khi xóa vị trí');
        this.loading = false;
      }
    });
  }

  //load data warehouse
  private loadWareHouses(): void {
    this.wareHouseService.getList().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.warehouses = response.data;
        }
      },
      error: (error) => {
        console.error('Error fetching warehouses:', error);
        this.toastr.error('Lỗi tải dữ liệu', error.error?.message || 'Có lỗi khi tải danh sách kho hàng');
      }
    })
  }

  // Helper methods for enum options
  getStatusOptions(): LocationStatus[] {
    return Object.values(LocationStatus);
  }

  getTypeOptions(): LocationType[] {
    return Object.values(LocationType);
  }

  // Pagination helper methods
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadLocations();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadLocations();
    }
  }
}

