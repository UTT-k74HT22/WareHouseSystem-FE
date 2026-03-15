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
import { InventoryFilterRequest } from '../../dto/request/Inventory/InventoryFilterRequest';
import {
  InventoryByLocationResponse,
  LocationInventoryItemResponse
} from '../../dto/response/Inventory/InventoryByLocationResponse';
import { InventorySummaryResponse } from '../../dto/response/Inventory/InventorySummaryResponse';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  items: InventoryResponse[] = [];
  locationGroups: InventoryByLocationResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  locations: LocationResponse[] = [];
  products: ProductResponse[] = [];

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  detailLoading = false;
  viewMode: 'grid' | 'list' = 'list';
  inventoryTab: 'records' | 'locations' = 'records';

  searchProductName = '';
  searchProductSku = '';
  searchBatchNumber = '';
  selectedWarehouseId = '';
  selectedLocationId = '';

  showDetailModal = false;
  selectedItem: InventoryResponse | null = null;
  selectedSummary: InventorySummaryResponse | null = null;
  selectedDistribution: InventoryByLocationResponse[] = [];

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

  get availableLocations(): LocationResponse[] {
    if (!this.selectedWarehouseId) {
      return this.locations;
    }

    return this.locations.filter((location) => location.warehouse_id === this.selectedWarehouseId);
  }

  get totalQuantityOnHand(): number {
    if (this.locationGroups.length > 0) {
      return this.sumLocationGroups((item) => item.on_hand_quantity);
    }
    return this.sumItems((item) => item.on_hand_quantity);
  }

  get totalQuantityReserved(): number {
    if (this.locationGroups.length > 0) {
      return this.sumLocationGroups((item) => item.reserved_quantity);
    }
    return this.sumItems((item) => item.reserved_quantity);
  }

  get totalQuantityAvailable(): number {
    if (this.locationGroups.length > 0) {
      return this.sumLocationGroups((item) => item.available_quantity);
    }
    return this.sumItems((item) => item.available_quantity);
  }

  get totalLocationGroups(): number {
    return this.locationGroups.length;
  }

  loadLookupData(): void {
    forkJoin({
      warehouses: this.warehouseService.getList().pipe(
        map((response) => response.data),
        catchError(() => of([] as WareHouseResponse[]))
      ),
      locations: this.locationService.getAll(0, 200).pipe(
        map((response) => response.data.content),
        catchError(() => of([] as LocationResponse[]))
      ),
      products: this.productService.getAll(0, 200).pipe(
        map((response) => response.data.content),
        catchError(() => of([] as ProductResponse[]))
      )
    }).subscribe((result) => {
      this.warehouses = result.warehouses;
      this.locations = result.locations;
      this.products = result.products;
      this.items = this.items.map((item) => this.enrichInventory(item));
      this.selectedItem = this.selectedItem ? this.enrichInventory(this.selectedItem) : null;
    });
  }

  loadInventory(): void {
    this.loading = true;
    const filters = this.buildFilters();

    forkJoin({
      page: this.inventoryService.getAll(this.currentPage, this.pageSize, filters),
      byLocation: this.inventoryService.getByLocation(filters).pipe(
        map((response) => response.success ? response.data : []),
        catchError(() => of([] as InventoryByLocationResponse[]))
      )
    }).subscribe({
      next: ({ page, byLocation }) => {
        if (page.success) {
          this.items = page.data.content.map((item) => this.enrichInventory(item));
          this.totalElements = page.data.total_elements;
          this.totalPages = page.data.total_pages;
        }

        this.locationGroups = this.sortLocationGroups(byLocation);
        this.loading = false;
      },
      error: (error) => {
        this.items = [];
        this.locationGroups = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.toastr.error(error?.error?.message || 'Không tải được dữ liệu tồn kho.');
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadInventory();
  }

  onResetFilter(): void {
    this.searchProductName = '';
    this.searchProductSku = '';
    this.searchBatchNumber = '';
    this.selectedWarehouseId = '';
    this.selectedLocationId = '';
    this.currentPage = 0;
    this.loadInventory();
  }

  onWarehouseChange(warehouseId: string): void {
    this.selectedWarehouseId = warehouseId;

    if (this.selectedLocationId) {
      const locationStillValid = this.availableLocations.some((location) => location.id === this.selectedLocationId);
      if (!locationStillValid) {
        this.selectedLocationId = '';
      }
    }
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.loadInventory();
  }

  openDetailModal(item: InventoryResponse): void {
    this.selectedItem = this.enrichInventory(item);
    this.selectedSummary = null;
    this.selectedDistribution = [];
    this.showDetailModal = true;
    this.loadDetailContext(this.selectedItem);
  }

  closeAllModals(): void {
    this.showDetailModal = false;
    this.selectedItem = null;
    this.selectedSummary = null;
    this.selectedDistribution = [];
    this.detailLoading = false;
  }

  getLowStockClass(item: InventoryResponse): string {
    if (item.available_quantity <= 0) {
      return 'low-critical';
    }
    if (item.available_quantity < 10) {
      return 'low-warning';
    }
    return '';
  }

  getStockStateLabel(item: InventoryResponse): string {
    if (item.available_quantity <= 0) {
      return 'Hết khả dụng';
    }
    if (item.available_quantity < 10) {
      return 'Khả dụng thấp';
    }
    return 'Ổn định';
  }

  getStockStateClass(item: InventoryResponse): string {
    if (item.available_quantity <= 0) {
      return 'inventory-badge-empty';
    }
    if (item.available_quantity < 10) {
      return 'inventory-badge-low';
    }
    return 'inventory-badge-ok';
  }

  getLocationGroupLabel(group: InventoryByLocationResponse): string {
    const code = group.location_code?.trim();
    const name = group.location_name?.trim();

    if (code && name) {
      return `${code} - ${name}`;
    }
    if (name) {
      return name === 'Unassigned' ? 'Chưa gán vị trí' : name;
    }
    if (code) {
      return code;
    }
    return 'Chưa gán vị trí';
  }

  getWarehouseLabel(group: InventoryByLocationResponse): string {
    return group.warehouse_name || 'Kho không xác định';
  }

  getGroupOnHand(group: InventoryByLocationResponse): number {
    return group.items.reduce((sum, item) => sum + Number(item.on_hand_quantity), 0);
  }

  getGroupReserved(group: InventoryByLocationResponse): number {
    return group.items.reduce((sum, item) => sum + Number(item.reserved_quantity), 0);
  }

  getGroupAvailable(group: InventoryByLocationResponse): number {
    return group.items.reduce((sum, item) => sum + Number(item.available_quantity), 0);
  }

  getDetailDistributionTitle(): string {
    if (this.selectedItem?.batch_id) {
      return 'Phân bổ tồn của lô theo vị trí';
    }
    return 'Phân bổ tồn của sản phẩm theo vị trí';
  }

  getSummaryAvailableQuantity(): number {
    if (!this.selectedSummary) {
      return 0;
    }

    const explicitAvailable = this.selectedSummary.total_available_quantity;
    if (explicitAvailable !== undefined && explicitAvailable !== null) {
      return Number(explicitAvailable);
    }

    return Number(this.selectedSummary.total_on_hand_quantity) - Number(this.selectedSummary.total_reserved_quantity);
  }

  private loadDetailContext(item: InventoryResponse): void {
    this.detailLoading = true;

    forkJoin({
      summary: this.inventoryService.getSummaryByProduct(item.product_id).pipe(
        map((response) => response.success ? response.data : null),
        catchError(() => of(null))
      ),
      distribution: this.inventoryService.getByLocation({
        product_id: item.product_id,
        batch_id: item.batch_id || undefined
      }).pipe(
        map((response) => response.success ? response.data : []),
        catchError(() => of([] as InventoryByLocationResponse[]))
      )
    }).subscribe(({ summary, distribution }) => {
      this.selectedSummary = summary;
      this.selectedDistribution = this.sortLocationGroups(distribution);
      this.detailLoading = false;
    });
  }

  private enrichInventory(item: InventoryResponse): InventoryResponse {
    const location = this.locations.find((entry) => entry.id === item.location_id);
    const product = this.products.find((entry) => entry.id === item.product_id);

    return {
      ...item,
      location_name: location?.name || item.location_name,
      uom_code: product?.uom_code || item.uom_code
    };
  }

  private buildFilters(): InventoryFilterRequest {
    return {
      product_name: this.searchProductName.trim() || undefined,
      product_sku: this.searchProductSku.trim() || undefined,
      batch_number: this.searchBatchNumber.trim() || undefined,
      warehouse_id: this.selectedWarehouseId || undefined,
      location_id: this.selectedLocationId || undefined
    };
  }

  private sortLocationGroups(groups: InventoryByLocationResponse[]): InventoryByLocationResponse[] {
    return [...groups]
      .map((group) => ({
        ...group,
        items: this.sortLocationItems(group.items || [])
      }))
      .sort((left, right) => {
        const warehouseCompare = this.getWarehouseLabel(left).localeCompare(this.getWarehouseLabel(right));
        if (warehouseCompare !== 0) {
          return warehouseCompare;
        }
        return this.getLocationGroupLabel(left).localeCompare(this.getLocationGroupLabel(right));
      });
  }

  private sortLocationItems(items: LocationInventoryItemResponse[]): LocationInventoryItemResponse[] {
    return [...items].sort((left, right) => {
      const productCompare = `${left.product_name || ''} ${left.product_sku || ''}`
        .localeCompare(`${right.product_name || ''} ${right.product_sku || ''}`);
      if (productCompare !== 0) {
        return productCompare;
      }
      return (left.batch_number || '').localeCompare(right.batch_number || '');
    });
  }

  private sumItems(selector: (item: InventoryResponse) => number): number {
    return this.items.reduce((sum, item) => sum + Number(selector(item)), 0);
  }

  private sumLocationGroups(selector: (item: LocationInventoryItemResponse) => number): number {
    return this.locationGroups.reduce(
      (sum, group) => sum + group.items.reduce((itemSum, item) => itemSum + Number(selector(item)), 0),
      0
    );
  }
}
