import { Component, OnInit } from '@angular/core';
import { CategoryResponse } from '../../dto/response/Category/CategoryResponse';
import { CategoryService } from '../../service/CategoryService/category.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { CategoryStatus } from '../../helper/enums/CategoryStatus';
import { CreateCategoryRequest } from '../../dto/request/Category/CreateCategoryRequest';
import { UpdateCategoryRequest } from '../../dto/request/Category/UpdateCategoryRequest';
import { UpdateCategoryStatusRequest } from '../../dto/request/Category/UpdateCategoryStatusRequest';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {
  readonly createPermissions = ['PERM_CATEGORY_CREATE'];
  readonly updatePermissions = ['PERM_CATEGORY_UPDATE'];
  readonly deletePermissions = ['PERM_CATEGORY_UPDATE'];

  // ─── Dữ liệu ────────────────────────────────────────────────────
  allCategories: CategoryResponse[] = [];
  categories: CategoryResponse[] = [];

  // ─── Phân trang ─────────────────────────────────────────────────
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';

  // ─── Bộ lọc ─────────────────────────────────────────────────────
  searchKeyword = '';
  selectedStatus: '' | CategoryStatus = '';

  // ─── Trạng thái Modal ────────────────────────────────────────────
  showCreateModal = false;
  showEditModal = false;
  showDeleteConfirm = false;
  selectedCategory: CategoryResponse | null = null;
  categoryToDelete: CategoryResponse | null = null;

  // ─── Form ────────────────────────────────────────────────────────
  createForm: CreateCategoryRequest = this.initCreateForm();
  editForm: UpdateCategoryRequest = {};
  editStatus: CategoryStatus = CategoryStatus.ACTIVE;

  // ─── Enums ──────────────────────────────────────────────────────
  CategoryStatus = CategoryStatus;

  constructor(
    private categoryService: CategoryService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getAll(0, 200, this.selectedStatus || undefined).subscribe({
      next: (res) => {
        if (res.success) {
          this.allCategories = res.data.content;
          this.applyFilter();
        }
        this.loading = false;
      },
      error: (error) => {
        this.allCategories = [];
        this.categories = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.toastr.error(error?.error?.message || 'Không tải được danh mục.');
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadCategories();
  }

  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedStatus = '';
    this.loadCategories();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.applyFilter();
  }

  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    if (!this.createForm.name.trim()) {
      this.toastr.error('Danh mục', 'Vui lòng nhập tên danh mục.');
      return;
    }
    this.categoryService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Danh mục', 'Tạo danh mục thành công!');
          this.showCreateModal = false;
          this.loadCategories();
        }
      }
    });
  }

  openEditModal(category: CategoryResponse): void {
    this.selectedCategory = category;
    this.editForm = {
      code: category.code,
      name: category.name,
      description: category.description ?? undefined
    };
    this.editStatus = category.status;
    this.showEditModal = true;
  }

  onEditSubmit(): void {
    if (!this.selectedCategory) return;
    const selectedCategory = this.selectedCategory;
    const statusRequest: UpdateCategoryStatusRequest = { status: this.editStatus || selectedCategory.status };

    this.categoryService.update(selectedCategory.id, this.editForm).subscribe({
      next: (res) => {
        if (!res.success) {
          return;
        }

        if (statusRequest.status !== selectedCategory.status) {
          this.categoryService.changeStatus(selectedCategory.id, statusRequest).subscribe({
            next: (statusRes) => {
              if (statusRes.success) {
                this.toastr.success('Cập nhật danh mục thành công!');
                this.showEditModal = false;
                this.loadCategories();
              }
            }
          });
          return;
        }

        this.toastr.success('Cập nhật danh mục thành công!');
        this.showEditModal = false;
        this.loadCategories();
      }
    });
  }

  openDeleteConfirm(category: CategoryResponse): void {
    this.categoryToDelete = category;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.categoryToDelete) return;
    const request: UpdateCategoryStatusRequest = { status: CategoryStatus.INACTIVE };
    this.categoryService.changeStatus(this.categoryToDelete.id, request).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã ngừng hoạt động danh mục.');
          this.showDeleteConfirm = false;
          this.loadCategories();
        }
      }
    });
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteConfirm = false;
    this.selectedCategory = null;
    this.categoryToDelete = null;
    this.editStatus = CategoryStatus.ACTIVE;
  }

  private initCreateForm(): CreateCategoryRequest {
    return { name: '', status: CategoryStatus.ACTIVE };
  }

  private applyFilter(): void {
    const keyword = this.searchKeyword.trim().toLowerCase();
    let filtered = [...this.allCategories];

    if (keyword) {
      filtered = filtered.filter((category) =>
        category.name.toLowerCase().includes(keyword)
        || category.code.toLowerCase().includes(keyword)
        || (category.description || '').toLowerCase().includes(keyword)
      );
    }

    this.totalElements = filtered.length;
    this.totalPages = this.totalElements === 0 ? 0 : Math.ceil(this.totalElements / this.pageSize);

    const start = this.currentPage * this.pageSize;
    this.categories = filtered.slice(start, start + this.pageSize);
  }

  getStatusLabel(status: CategoryStatus): string {
    return status === CategoryStatus.ACTIVE ? 'Đang hoạt động' : 'Ngừng hoạt động';
  }

  getStatusClass(status: CategoryStatus): string {
    return status === CategoryStatus.ACTIVE ? 'badge-active' : 'badge-inactive';
  }
}

