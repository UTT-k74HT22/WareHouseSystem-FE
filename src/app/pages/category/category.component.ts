import { Component, OnInit } from '@angular/core';
import { CategoryResponse } from '../../dto/response/Category/CategoryResponse';
import { CategoryService } from '../../service/CategoryService/category.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { CategoryStatus } from '../../helper/enums/CategoryStatus';
import { CreateCategoryRequest } from '../../dto/request/Category/CreateCategoryRequest';
import { UpdateCategoryRequest } from '../../dto/request/Category/UpdateCategoryRequest';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {
  readonly createPermissions = ['PERM_CATEGORY_CREATE'];
  readonly updatePermissions = ['PERM_CATEGORY_UPDATE'];
  readonly deletePermissions = ['PERM_CATEGORY_UPDATE'];

  // ─── Dữ liệu (server-side paging) ───────────────────────────────
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

  private loadSeq = 0;

  loadCategories(silent = false): void {
    if (!silent) {
      this.loading = true;
    }
    const seq = ++this.loadSeq;
    this.categoryService.getAll(this.currentPage, this.pageSize, this.searchKeyword, this.selectedStatus || undefined).subscribe({
      next: (res) => {
        if (seq !== this.loadSeq) {
          return;
        }
        if (res.success && res.data) {
          this.categories = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: (error) => {
        if (seq !== this.loadSeq) {
          return;
        }
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
    this.loadCategories(true);
  }

  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedStatus = '';
    this.currentPage = 0;
    this.loadCategories(true);
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadCategories();
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
    this.categoryService.create({ ...this.createForm, name: this.createForm.name.trim() }).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Danh mục', 'Tạo danh mục thành công!');
          this.showCreateModal = false;
          this.loadCategories();
        }
      },
      error: (error) => {
        this.toastr.error('Danh mục', error?.error?.message || 'Có lỗi khi tạo danh mục.');
      }
    });
  }

  openEditModal(category: CategoryResponse): void {
    this.selectedCategory = category;
    this.editForm = {
      name: category.name,
      description: category.description ?? undefined
    };
    this.editStatus = category.status;
    this.showEditModal = true;
  }

  onEditSubmit(): void {
    if (!this.selectedCategory) return;
    const selectedCategory = this.selectedCategory;
    if (this.editForm.name != null && !this.editForm.name.trim()) {
      this.toastr.error('Danh mục', 'Tên danh mục không được để trống.');
      return;
    }
    const payload: UpdateCategoryRequest = {
      name: this.editForm.name?.trim() || undefined,
      description: this.editForm.description
    };

    this.categoryService.update(selectedCategory.id, payload).subscribe({
      next: (res) => {
        if (!res.success) {
          return;
        }

        if (this.editStatus !== selectedCategory.status) {
          this.categoryService.changeStatus(selectedCategory.id, { status: this.editStatus }).subscribe({
            next: (statusRes) => {
              if (statusRes.success) {
                this.toastr.success('Cập nhật danh mục thành công!');
                this.showEditModal = false;
                this.loadCategories();
              }
            },
            error: (error) => {
              this.toastr.error('Danh mục', error?.error?.message || 'Có lỗi khi đổi trạng thái.');
            }
          });
          return;
        }

        this.toastr.success('Cập nhật danh mục thành công!');
        this.showEditModal = false;
        this.loadCategories();
      },
      error: (error) => {
        this.toastr.error('Danh mục', error?.error?.message || 'Có lỗi khi cập nhật danh mục.');
      }
    });
  }

  openDeleteConfirm(category: CategoryResponse): void {
    this.categoryToDelete = category;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.categoryToDelete) return;
    this.categoryService.changeStatus(this.categoryToDelete.id, { status: CategoryStatus.INACTIVE }).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã ngừng hoạt động danh mục.');
          this.showDeleteConfirm = false;
          this.loadCategories();
        }
      },
      error: (error) => {
        this.toastr.error('Danh mục', error?.error?.message || 'Có lỗi khi ngừng hoạt động danh mục.');
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

  getStatusLabel(status: CategoryStatus): string {
    return status === CategoryStatus.ACTIVE ? 'Đang hoạt động' : 'Ngừng hoạt động';
  }

  getStatusClass(status: CategoryStatus): string {
    return status === CategoryStatus.ACTIVE ? 'badge-active' : 'badge-inactive';
  }
}

