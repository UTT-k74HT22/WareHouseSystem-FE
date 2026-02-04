import { Component, OnInit } from '@angular/core';
import { LocationResponse } from '../../../dto/response/Location/LocationResponse';
import { LocationService } from '../../../service/Location/location.service';
import { LocationStatus } from '../../../helper/enums/LocationStatus';
import { LocationType } from '../../../helper/enums/LocationType';
import { CreateLocationRequest } from '../../../dto/request/Location/CreateLocationRequest';
import { UpdateLocationRequest } from '../../../dto/request/Location/UpdateLocationRequest';
import { ChangeLocationStatusRequest } from '../../../dto/request/Location/ChangeLocationStatusRequest';
import { SearchLocationRequest } from '../../../dto/request/Location/SearchLocationRequest';
import { ToastrService } from '../../../service/SystemService/toastr.service';
import { LOCATION_STATUS_LABELS, LOCATION_TYPE_LABELS } from '../../../helper/constraint/location-labels';
import {WareHouseResponse} from "../../../dto/response/WareHouse/WareHouseResponse";
import {WarehouseService} from "../../../service/WarehouseService/warehouse.service";

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.css']
})
export class LocationComponent implements OnInit {

  locations: LocationResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  selectedLocation: LocationResponse | null = null;
  loading: boolean = false;
  viewMode: 'grid' | 'list' = 'grid';
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;

  // Filter properties
  searchTerm: string = '';
  selectedWarehouseId: string = '';
  selectedStatus: '' | LocationStatus = '';
  selectedType: '' | LocationType = '';
  selectedZone: string = '';

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
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  private initCreateForm(): CreateLocationRequest {
    return {
      warehouse_id: '',
      code: '',
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

  loadLocations(): void {
    this.loading = true;

    this.locationService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.locations = response.data.content;
          this.totalElements = response.data.total_elements;
          this.totalPages = response.data.total_pages;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching locations:', error);
        this.toastr.error('Lỗi tải dữ liệu', error.error?.message || 'Có lỗi khi tải danh sách vị trí');
        this.loading = false;
      }
    });
  }

  // Filter and search methods
  getFilteredLocations(): LocationResponse[] {
    return this.locations.filter(location => {
      const matchesSearch = !this.searchTerm ||
        location.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        location.code.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (location.zone && location.zone.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesWarehouse = !this.selectedWarehouseId ||
        location.warehouse_id === this.selectedWarehouseId;

      const matchesStatus = !this.selectedStatus ||
        location.status === this.selectedStatus;

      const matchesType = !this.selectedType ||
        location.type === this.selectedType;

      const matchesZone = !this.selectedZone ||
        (location.zone && location.zone.toLowerCase().includes(this.selectedZone.toLowerCase()));

      return matchesSearch && matchesWarehouse && matchesStatus && matchesType && matchesZone;
    });
  }

  onSearch(): void {
    // Search is handled by getFilteredLocations()
  }

  onFilterChange(): void {
    // Filter is handled by getFilteredLocations()
  }

  // Statistics methods
  getActiveCount(): number {
    return this.locations.filter(l => l.status === LocationStatus.ACTIVE).length;
  }

  getInactiveCount(): number {
    return this.locations.filter(l => l.status === LocationStatus.INACTIVE).length;
  }

  getFullCount(): number {
    return this.locations.filter(l => l.status === LocationStatus.FULL).length;
  }

  getMaintenanceCount(): number {
    return this.locations.filter(l => l.status === LocationStatus.MAINTENANCE).length;
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
    this.loading = true;

    this.locationService.create(this.createForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Tạo vị trí mới thành công');
          this.closeCreateModal();
          this.loadLocations();
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

    this.loading = true;

    this.locationService.update(this.locationToEdit.id, this.editForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Cập nhật vị trí thành công');
          this.closeEditModal();
          this.loadLocations();
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

    this.loading = true;

    const request: ChangeLocationStatusRequest = {
      status: this.newStatus,
      reason: this.statusChangeReason
    };

    this.locationService.changeStatus(this.locationToChangeStatus.id, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Thay đổi trạng thái vị trí thành công');
          this.closeStatusChangeModal();
          this.loadLocations();
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

