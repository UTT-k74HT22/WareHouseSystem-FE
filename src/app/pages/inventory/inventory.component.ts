import { Component, OnInit } from '@angular/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { InventoryResponse } from '../../dto/response/Inventory/InventoryResponse';
import { InventoryService } from '../../service/InventoryService/inventory.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';
import { LocationService } from '../../service/Location/location.service';
import { ProductService } from '../../service/ProductService/product.service';
import { LocationResponse } from '../../dto/response/Location/LocationResponse';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  items: InventoryResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  locations: LocationResponse[] = [];
  products: ProductResponse[] = [];

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
    private warehouseService: WarehouseService,
    private locationService: LocationService,
    private productService: ProductService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadLookupData();
    this.loadInventory();
  }

  private loadLookupData(): void {
    forkJoin({
      warehouses: this.warehouseService.getList().pipe(
        map((response) => response.data),
        catchError(() => of([]))
      ),
      locations: this.locationService.getAll(0, 200).pipe(
        map((response) => response.data.content),
        catchError(() => of([]))
      ),
      products: this.productService.getAll(0, 200).pipe(
        map((response) => response.data.content),
        catchError(() => of([]))
      ),
    }).subscribe((result) => {
      this.warehouses = result.warehouses;
      this.locations = result.locations;
      this.products = result.products;
      this.items = this.items.map((item) => this.enrichInventory(item));
    });
  }

  loadInventory(): void {
    this.loading = true;
    this.inventoryService.getAll(this.currentPage, this.pageSize, {
      product_name: this.searchProductKeyword.trim() || undefined,
      warehouse_id: this.selectedWarehouseId || undefined,
      location_id: this.selectedLocationId || undefined,
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.items = res.data.content.map((item) => this.enrichInventory(item));
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: (error) => {
        this.items = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.toastr.error(error?.error?.message || 'Không tải được dữ liệu tồn kho.');
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

  private enrichInventory(item: InventoryResponse): InventoryResponse {
    const location = this.locations.find((entry) => entry.id === item.location_id);
    const product = this.products.find((entry) => entry.id === item.product_id);

    return {
      ...item,
      location_name: location?.name || item.location_name,
      uom_code: product?.uom_code || item.uom_code,
    };
  }

  get totalQuantityOnHand(): number {
    return this.items.reduce((sum, i) => sum + Number(i.on_hand_quantity), 0);
  }

  get totalQuantityAvailable(): number {
    return this.items.reduce((sum, i) => sum + Number(i.available_quantity), 0);
  }

  getLowStockClass(item: InventoryResponse): string {
    if (item.available_quantity <= 0) return 'low-critical';
    if (item.available_quantity < 10) return 'low-warning';
    return '';
  }
}

