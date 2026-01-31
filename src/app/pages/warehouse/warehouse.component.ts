import { Component, OnInit } from '@angular/core';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';
import { WareHouseStatus } from '../../helper/enums/WareHouseStatus';
import { WareHouseType } from '../../helper/enums/WareHouseType';

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
  selectedStatus: string = '';
  selectedType: string = '';

  constructor(private warehouseService: WarehouseService) {}

  ngOnInit(): void {
    this.loadWarehouses();
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
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'Hoạt động',
      'INACTIVE': 'Ngừng hoạt động',
      'UNDER_MAINTENANCE': 'Bảo trì'
    };
    return statusMap[status || ''] || status || 'Không xác định';
  }

  getTypeLabel(type: WareHouseType | undefined): string {
    const typeMap: { [key: string]: string } = {
      'MAIN': 'Kho chính',
      'SATELLITE': 'Kho vệ tinh',
      'TRANSIT': 'Kho trung chuyển',
      'RETURN': 'Kho hoàn trả'
    };
    return typeMap[type || ''] || type || 'Không xác định';
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
}
