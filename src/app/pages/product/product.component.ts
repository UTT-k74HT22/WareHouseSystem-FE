import { Component, OnInit } from '@angular/core';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { ProductService } from '../../service/ProductService/product.service';
import { CategoryService } from '../../service/CategoryService/category.service';
import { UOMService } from '../../service/UOMService/uom.service';
import { StorageService } from '../../service/StorageService/storage.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { ProductStatus } from '../../helper/enums/ProductStatus';
import { CategoryResponse } from '../../dto/response/Category/CategoryResponse';
import { UnitsOfMeasureResponse } from '../../dto/response/UOM/UnitsOfMeasureResponse';
import { CreateProductRequest } from '../../dto/request/Product/CreateProductRequest';
import { UpdateProductRequest } from '../../dto/request/Product/UpdateProductRequest';
import { SearchProductRequest } from '../../dto/request/Product/SearchProductRequest';

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

  // ─── Image ───────────────────────────────────────────────────────
  imageUrlMap: Map<string, string> = new Map();  // productId → presigned URL
  createImagePreview: string | null = null;       // preview trước khi tạo
  editImagePreview: string | null = null;         // preview khi chỉnh sửa
  uploadingImage = false;

  // ─── Enums (dùng trong template) ────────────────────────────────
  ProductStatus = ProductStatus;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private uomService: UOMService,
    private storageService: StorageService,
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
    const request = this.buildSearchRequest();
    const action = this.hasActiveFilters()
      ? this.productService.search(request, this.currentPage, this.pageSize)
      : this.productService.getAll(this.currentPage, this.pageSize);

    action.subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
          this.resolveProductImages(this.products);
        }
        this.loading = false;
      },
      error: (error) => {
        this.products = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.toastr.error(error?.error?.message || 'Không tải được danh sách sản phẩm.');
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAll(0, 100).subscribe({
      next: (res) => { if (res.success) this.categories = res.data.content; },
      error: () => {
        this.categories = [];
        this.toastr.error('Không tải được danh mục sản phẩm.');
      }
    });
  }

  loadUOMs(): void {
    this.uomService.getAll().subscribe({
      next: (res) => { if (res.success) this.uomList = res.data; },
      error: () => {
        this.uomList = [];
        this.toastr.error('Không tải được đơn vị tính.');
      }
    });
  }

  // ══════════════════════════════════════════════════
  // TÌM KIẾM & LỌC
  // ══════════════════════════════════════════════════
  onSearch(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedCategoryId = '';
    this.selectedStatus = '';
    this.isBatchTrackedFilter = '';
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
    this.createImagePreview = null;
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
      image_url: product.image_url ?? undefined,
      requires_batch_tracking: product.requires_batch_tracking ?? undefined,
    };
    this.editImagePreview = this.imageUrlMap.get(product.id) || null;
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
    this.createImagePreview = null;
    this.editImagePreview = null;
  }

  // ══════════════════════════════════════════════════
  // HELPER
  // ══════════════════════════════════════════════════
  private initCreateForm(): CreateProductRequest {
    return {
      name: '',
      category_id: '',
      uom_id: '',
      status: ProductStatus.ACTIVE,
      requires_batch_tracking: false
    };
  }

  private buildSearchRequest(): SearchProductRequest {
    return {
      category_id: this.selectedCategoryId || undefined,
      status: this.selectedStatus || undefined,
      requires_batch_tracking: this.isBatchTrackedFilter === '' ? undefined : this.isBatchTrackedFilter,
      search_text: this.searchKeyword.trim() || undefined,
    };
  }

  private hasActiveFilters(): boolean {
    return Boolean(
      this.searchKeyword.trim()
      || this.selectedCategoryId
      || this.selectedStatus
      || this.isBatchTrackedFilter !== ''
    );
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

  // ══════════════════════════════════════════════════
  // IMAGE — MinIO presigned URL & Upload
  // ══════════════════════════════════════════════════

  /**
   * Lấy presigned URL cho tất cả sản phẩm có image_url (MinIO object name).
   * Cache kết quả vào imageUrlMap để tránh gọi API lặp lại.
   */
  private resolveProductImages(products: ProductResponse[]): void {
    products.forEach(p => {
      if (p.image_url && !this.imageUrlMap.has(p.id)) {
        this.storageService.getPresignedUrl(p.image_url).subscribe({
          next: (res) => {
            if (res.success && res.data?.presignedUrl) {
              this.imageUrlMap.set(p.id, res.data.presignedUrl);
            }
          },
          error: () => { /* MinIO không khả dụng, bỏ qua */ }
        });
      }
    });
  }

  /** Lấy presigned URL đã cache cho 1 product */
  getProductImageUrl(productId: string): string | null {
    return this.imageUrlMap.get(productId) || null;
  }

  /**
   * Upload ảnh lên MinIO khi chọn file trong form Create.
   * Sau khi upload thành công:
   *  - Gán object_name vào createForm.image_url
   *  - Hiện preview bằng presigned_url từ response
   */
  onCreateImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    // Validate phía client
    if (!file.type.startsWith('image/')) {
      this.toastr.error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.toastr.error('Dung lượng file tối đa 50MB');
      return;
    }

    // Hiện preview ngay lập tức bằng local URL
    this.createImagePreview = URL.createObjectURL(file);

    this.uploadingImage = true;
    this.storageService.uploadFile(file, 'products').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.createForm.image_url = res.data.object_name;
          // Thay preview local bằng presigned URL từ server
          if (res.data.presigned_url) {
            URL.revokeObjectURL(this.createImagePreview!);
            this.createImagePreview = res.data.presigned_url;
          }
          this.toastr.success('Tải ảnh lên thành công!');
        }
        this.uploadingImage = false;
      },
      error: () => {
        this.toastr.error('Tải ảnh lên thất bại');
        // Giữ preview local để user thấy ảnh đã chọn
        this.uploadingImage = false;
      }
    });
  }

  /**
   * Upload ảnh lên MinIO khi chọn file trong form Edit.
   */
  onEditImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.toastr.error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.toastr.error('Dung lượng file tối đa 50MB');
      return;
    }

    // Hiện preview ngay lập tức bằng local URL
    this.editImagePreview = URL.createObjectURL(file);

    this.uploadingImage = true;
    this.storageService.uploadFile(file, 'products').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.editForm.image_url = res.data.object_name;
          // Thay preview local bằng presigned URL từ server
          if (res.data.presigned_url) {
            URL.revokeObjectURL(this.editImagePreview!);
            this.editImagePreview = res.data.presigned_url;
          }
          this.toastr.success('Tải ảnh lên thành công!');
        }
        this.uploadingImage = false;
      },
      error: () => {
        this.toastr.error('Tải ảnh lên thất bại');
        // Giữ preview local để user thấy ảnh đã chọn
        this.uploadingImage = false;
      }
    });
  }

  /** Xoá ảnh trong form Create */
  removeCreateImage(): void {
    if (this.createImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.createImagePreview);
    }
    this.createForm.image_url = undefined;
    this.createImagePreview = null;
  }

  /** Xoá ảnh trong form Edit */
  removeEditImage(): void {
    if (this.editImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.editImagePreview);
    }
    this.editForm.image_url = undefined;
    this.editImagePreview = null;
  }
}

