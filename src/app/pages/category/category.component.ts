import { Component, OnInit } from '@angular/core';
import { CategoryResponse } from '../../dto/response/Category/CategoryResponse';
import { CategoryService } from '../../service/CategoryService/category.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { CategoryStatus } from '../../helper/enums/CategoryStatus';
import { CreateCategoryRequest } from '../../dto/request/Category/CreateCategoryRequest';
import { UpdateCategoryRequest } from '../../dto/request/Category/UpdateCategoryRequest';
import { MOCK_CATEGORIES, mockPage } from '../../helper/mock/mock-data';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {
  // ─── Dữ liệu ────────────────────────────────────────────────────
  categories: CategoryResponse[] = [];

  // ─── Phân trang ─────────────────────────────────────────────────
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;

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
    this.categoryService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.categories = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        const page = mockPage(MOCK_CATEGORIES, this.currentPage, this.pageSize);
        this.categories = page.content;
        this.totalElements = page.total_elements;
        this.totalPages = page.total_pages;
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    // TODO: Gọi API search khi BE implement
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
    this.loadCategories();
  }

  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    this.categoryService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo danh mục thành công!');
          this.showCreateModal = false;
          this.loadCategories();
        }
      }
    });
  }

  openEditModal(category: CategoryResponse): void {
    this.selectedCategory = category;
    this.editForm = {
      name: category.name,
      description: category.description ?? undefined,
      status: category.status
    };
    this.showEditModal = true;
  }

  onEditSubmit(): void {
    if (!this.selectedCategory) return;
    this.categoryService.update(this.selectedCategory.id, this.editForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Cập nhật danh mục thành công!');
          this.showEditModal = false;
          this.loadCategories();
        }
      }
    });
  }

  openDeleteConfirm(category: CategoryResponse): void {
    this.categoryToDelete = category;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.categoryToDelete) return;
    this.categoryService.delete(this.categoryToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xoá danh mục thành công!');
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
  }

  private initCreateForm(): CreateCategoryRequest {
    return { code: '', name: '', status: CategoryStatus.ACTIVE };
  }

  getStatusLabel(status: CategoryStatus): string {
    return status === CategoryStatus.ACTIVE ? 'Đang hoạt động' : 'Ngừng hoạt động';
  }

  getStatusClass(status: CategoryStatus): string {
    return status === CategoryStatus.ACTIVE ? 'badge-active' : 'badge-inactive';
  }
}
