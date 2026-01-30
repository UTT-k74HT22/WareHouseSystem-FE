import { Component, OnInit } from '@angular/core';
import { Warehouse, WarehouseStats } from '../../dto/Warehouse';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';

@Component({
  selector: 'app-warehouse',
  templateUrl: './warehouse.component.html',
  styleUrls: ['./warehouse.component.css']
})
export class WarehouseComponent implements OnInit {
  warehouses: Warehouse[] = [];
  filteredWarehouses: Warehouse[] = [];
  stats: WarehouseStats | null = null;
  selectedWarehouse: Warehouse | null = null;

  // Filters and search
  searchTerm: string = '';
  selectedStatus: string = 'ALL';

  // Loading state
  loading: boolean = false;

  // View mode
  viewMode: 'grid' | 'list' = 'grid';

  constructor(private warehouseService: WarehouseService) {}

  ngOnInit(): void {
    this.loadWarehouses();
    this.loadStats();
  }

  loadWarehouses(): void {
    this.loading = true;
    this.warehouseService.getAllWarehouses().subscribe({
      next: (data) => {
        this.warehouses = data;
        this.filteredWarehouses = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading warehouses:', error);
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.warehouseService.getWarehouseStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.applyFilters();
      return;
    }

    this.loading = true;
    this.warehouseService.searchWarehouses(this.searchTerm).subscribe({
      next: (data) => {
        this.filteredWarehouses = data;
        if (this.selectedStatus !== 'ALL') {
          this.filteredWarehouses = this.filteredWarehouses.filter(
            w => w.status === this.selectedStatus
          );
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching warehouses:', error);
        this.loading = false;
      }
    });
  }

  onStatusFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.loading = true;
    this.warehouseService.filterByStatus(this.selectedStatus).subscribe({
      next: (data) => {
        this.filteredWarehouses = data;
        if (this.searchTerm.trim()) {
          this.filteredWarehouses = this.filteredWarehouses.filter(w =>
            w.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            w.code.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            w.city.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error filtering warehouses:', error);
        this.loading = false;
      }
    });
  }

  selectWarehouse(warehouse: Warehouse): void {
    this.selectedWarehouse = warehouse;
  }

  closeDetail(): void {
    this.selectedWarehouse = null;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'INACTIVE':
        return 'status-inactive';
      case 'MAINTENANCE':
        return 'status-maintenance';
      default:
        return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Hoạt động';
      case 'INACTIVE':
        return 'Không hoạt động';
      case 'MAINTENANCE':
        return 'Bảo trì';
      default:
        return status;
    }
  }

  getOccupancyPercentage(warehouse: Warehouse): number {
    return Math.round((warehouse.currentOccupancy / warehouse.capacity) * 100);
  }

  getOccupancyClass(percentage: number): string {
    if (percentage >= 90) return 'occupancy-high';
    if (percentage >= 70) return 'occupancy-medium';
    return 'occupancy-low';
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }
}
