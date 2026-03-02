import { Component, OnInit } from '@angular/core';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { ProductService } from '../../service/ProductService/product.service';
import { CategoryService } from '../../service/CategoryService/category.service';
import { UOMService } from '../../service/UOMService/uom.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { ProductStatus } from '../../helper/enums/ProductStatus';
import { CategoryResponse } from '../../dto/response/Category/CategoryResponse';
import { UnitsOfMeasureResponse } from '../../dto/response/UOM/UnitsOfMeasureResponse';
import { CreateProductRequest } from '../../dto/request/Product/CreateProductRequest';
import { UpdateProductRequest } from '../../dto/request/Product/UpdateProductRequest';
import { SearchProductRequest } from '../../dto/request/Product/SearchProductRequest';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_UOMS, mockPage } from '../../helper/mock/mock-data';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit {
  // ─── Dữ liệu ────────────────────────────────────────────────────
  products: ProductResponse[] = [];
  categories: CategoryResponse[] = [];
  uomList: UnitsOfMeasureResponse[] = [];

  // ─── Phân trang ─────────────────────────────────────────────────
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';

  // ─── Bộ lọc ─────────────────────────────────────────────────────
  searchKeyword = '';
  selectedCategoryId = '';
  selectedStatus: '' | ProductStatus = '';
  isBatchTrackedFilter: '' | boolean = '';

  // ─── Trạng thái Modal ────────────────────────────────────────────
  showCreateModal = false;
  showEditModal = false;
  showDeleteConfirm = false;
  selectedProduct: ProductResponse | null = null;
  productToDelete: ProductResponse | null = null;

  // ─── Form ────────────────────────────────────────────────────────
  createForm: CreateProductRequest = this.initCreateForm();
  editForm: UpdateProductRequest = {};

  // ─── Enums (dùng trong template) ────────────────────────────────
  ProductStatus = ProductStatus;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private uomService: UOMService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadUOMs();
  }

  // ══════════════════════════════════════════════════
  // LOAD DỮ LIỆU
  // ══════════════════════════════════════════════════
  loadProducts(): void {
    this.loading = true;
    // TODO: dùng search() nếu có filter, getAll() nếu không
    this.productService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        // Fallback: dùng mock data khi BE chưa sẵn sàng
        const page = mockPage(MOCK_PRODUCTS, this.currentPage, this.pageSize);
        this.products = page.content;
        this.totalElements = page.total_elements;
        this.totalPages = page.total_pages;
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAll(0, 100).subscribe({
      next: (res) => { if (res.success) this.categories = res.data.content; },
      error: () => { this.categories = MOCK_CATEGORIES; }
    });
  }

  loadUOMs(): void {
    this.uomService.getAll().subscribe({
      next: (res) => { if (res.success) this.uomList = res.data; },
      error: () => { this.uomList = MOCK_UOMS; }
    });
  }

  // ══════════════════════════════════════════════════
  // TÌM KIẾM & LỌC
  // ══════════════════════════════════════════════════
  onSearch(): void {
    this.currentPage = 0;
    const request: SearchProductRequest = {
      keyword: this.searchKeyword || undefined,
      category_id: this.selectedCategoryId || undefined,
      status: this.selectedStatus || undefined
    };
    this.loading = true;
    this.productService.search(request, this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedCategoryId = '';
    this.selectedStatus = '';
    this.loadProducts();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
  }

  // ══════════════════════════════════════════════════
  // CRUD ACTIONS
  // ══════════════════════════════════════════════════
  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    // TODO: validate + gọi productService.create(this.createForm)
    this.productService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo sản phẩm thành công!');
          this.showCreateModal = false;
          this.loadProducts();
        }
      }
    });
  }

  openEditModal(product: ProductResponse): void {
    this.selectedProduct = product;
    this.editForm = {
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      uom_id: product.uom_id,
      status: product.status,
      // TODO: fill thêm các field khác
    };
    this.showEditModal = true;
  }

  onEditSubmit(): void {
    if (!this.selectedProduct) return;
    this.productService.update(this.selectedProduct.id, this.editForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Cập nhật sản phẩm thành công!');
          this.showEditModal = false;
          this.loadProducts();
        }
      }
    });
  }

  openDeleteConfirm(product: ProductResponse): void {
    this.productToDelete = product;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.productToDelete) return;
    this.productService.delete(this.productToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xoá sản phẩm thành công!');
          this.showDeleteConfirm = false;
          this.loadProducts();
        }
      }
    });
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteConfirm = false;
    this.productToDelete = null;
    this.selectedProduct = null;
  }

  // ══════════════════════════════════════════════════
  // HELPER
  // ══════════════════════════════════════════════════
  private initCreateForm(): CreateProductRequest {
    return {
      sku: '',
      name: '',
      category_id: '',
      uom_id: '',
      status: ProductStatus.ACTIVE,
      is_batch_tracked: false
    };
  }

  getStatusLabel(status: ProductStatus): string {
    const labels: Record<ProductStatus, string> = {
      [ProductStatus.ACTIVE]: 'Đang hoạt động',
      [ProductStatus.INACTIVE]: 'Ngừng hoạt động',
      [ProductStatus.DISCONTINUED]: 'Ngừng kinh doanh'
    };
    return labels[status] ?? status;
  }

  getStatusClass(status: ProductStatus): string {
    const classes: Record<ProductStatus, string> = {
      [ProductStatus.ACTIVE]: 'badge-active',
      [ProductStatus.INACTIVE]: 'badge-inactive',
      [ProductStatus.DISCONTINUED]: 'badge-discontinued'
    };
    return classes[status] ?? '';
  }

  getActiveCount(): number {
    return this.products.filter(p => p.status === ProductStatus.ACTIVE).length;
  }
}

