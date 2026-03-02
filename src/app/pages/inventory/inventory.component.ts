import { Component, OnInit } from '@angular/core';
import { InventoryResponse } from '../../dto/response/Inventory/InventoryResponse';
import { InventoryService } from '../../service/InventoryService/inventory.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { MOCK_INVENTORIES, MOCK_WAREHOUSES, mockPage } from '../../helper/mock/mock-data';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  items: InventoryResponse[] = [];
  warehouses: WareHouseResponse[] = [];

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';

  searchProductKeyword = '';
  selectedWarehouseId = '';
  selectedLocationId = '';

  showDetailModal = false;
  selectedItem: InventoryResponse | null = null;

  constructor(
    private inventoryService: InventoryService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading = true;
    this.inventoryService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.items = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        const page = mockPage(MOCK_INVENTORIES, this.currentPage, this.pageSize);
        this.items = page.content;
        this.totalElements = page.total_elements;
        this.totalPages = page.total_pages;
        this.warehouses = MOCK_WAREHOUSES as any;
        this.loading = false;
      }
    });
  }

  onSearch(): void { this.currentPage = 0; this.loadInventory(); }
  onResetFilter(): void {
    this.searchProductKeyword = '';
    this.selectedWarehouseId = '';
    this.selectedLocationId = '';
    this.loadInventory();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadInventory();
  }

  openDetailModal(item: InventoryResponse): void {
    this.selectedItem = item;
    this.showDetailModal = true;
  }

  closeAllModals(): void {
    this.showDetailModal = false;
    this.selectedItem = null;
  }

  get totalQuantityOnHand(): number {
    return this.items.reduce((sum, i) => sum + i.quantity_on_hand, 0);
  }

  get totalQuantityAvailable(): number {
    return this.items.reduce((sum, i) => sum + i.quantity_available, 0);
  }

  getLowStockClass(item: InventoryResponse): string {
    if (item.quantity_available <= 0) return 'low-critical';
    if (item.quantity_available < 10) return 'low-warning';
    return '';
  }
}

