import { Component, OnInit } from '@angular/core';
import { BatchResponse } from '../../dto/response/Batch/BatchResponse';
import { BatchService } from '../../service/BatchService/batch.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { BatchStatus } from '../../helper/enums/BatchStatus';
import { ChangeBatchStatusRequest, CreateBatchRequest } from '../../dto/request/Batch/BatchRequest';
import { ProductService } from '../../service/ProductService/product.service';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';

@Component({
  selector: 'app-batch',
  templateUrl: './batch.component.html',
  styleUrls: ['./batch.component.css']
})
export class BatchComponent implements OnInit {
  allBatches: BatchResponse[] = [];
  batches: BatchResponse[] = [];
  products: ProductResponse[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';

  searchKeyword = '';
  selectedStatus: '' | BatchStatus = '';

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;

  createForm: CreateBatchRequest = this.initCreateForm();
  editForm: ChangeBatchStatusRequest = { status: BatchStatus.ACTIVE };
  selectedBatch: BatchResponse | null = null;

  BatchStatus = BatchStatus;

  constructor(
    private batchService: BatchService,
    private productService: ProductService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadBatches();
  }

  private loadProducts(): void {
    this.productService.getAll(0, 200).subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data.content;
          this.batches = this.batches.map((batch) => this.enrichBatch(batch));
        }
      },
      error: () => {
        this.products = [];
      }
    });
  }

  loadBatches(): void {
    this.loading = true;
    this.batchService.getAll(0, 200).subscribe({
      next: (res) => {
        if (res.success) {
          this.allBatches = res.data.content.map((batch) => this.enrichBatch(batch));
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (error) => {
        this.allBatches = [];
        this.batches = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.toastr.error(error?.error?.message || 'Không tải được danh sách lô hàng.');
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedStatus = '';
    this.currentPage = 0;
    this.applyFilters();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.applyFilters();
  }

  openCreateModal(): void { this.createForm = this.initCreateForm(); this.showCreateModal = true; }

  openEditModal(b: BatchResponse): void {
    this.selectedBatch = b;
    this.editForm = {
      status: b.status,
    };
    this.showEditModal = true;
  }

  openDeleteModal(b: BatchResponse): void { this.selectedBatch = b; this.showDeleteModal = true; }

  onCreateSubmit(): void {
    this.batchService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo lô hàng thành công!');
          this.showCreateModal = false;
          this.loadBatches();
        }
      }
    });
  }

  onEditSubmit(): void {
    if (!this.selectedBatch) {
      return;
    }

    this.batchService.changeStatus(this.selectedBatch.id, this.editForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Cập nhật trạng thái lô hàng thành công!');
          this.showEditModal = false;
          this.loadBatches();
        }
      }
    });
  }

  onDeleteConfirm(): void {
    if (!this.selectedBatch) return;
    this.batchService.changeStatus(this.selectedBatch.id, { status: BatchStatus.DISPOSED }).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã chuyển lô hàng sang trạng thái huỷ!');
          this.showDeleteModal = false;
          this.loadBatches();
        }
      }
    });
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedBatch = null;
  }

  getStatusLabel(status: BatchStatus): string {
    const labels: Record<BatchStatus, string> = {
      [BatchStatus.ACTIVE]:    'Đang dùng',
      [BatchStatus.EXPIRED]:   'Hết hạn',
      [BatchStatus.QUARANTINE]:'Kiểm dịch',
      [BatchStatus.DISPOSED]:  'Đã huỷ'
    };
    return labels[status];
  }

  getStatusClass(status: BatchStatus): string {
    const classes: Record<BatchStatus, string> = {
      [BatchStatus.ACTIVE]:    'badge-active',
      [BatchStatus.EXPIRED]:   'badge-expired',
      [BatchStatus.QUARANTINE]:'badge-quarantine',
      [BatchStatus.DISPOSED]:  'badge-inactive'
    };
    return classes[status];
  }

  get activeCount(): number   { return this.allBatches.filter(b => b.status === BatchStatus.ACTIVE).length; }
  get expiredCount(): number  { return this.allBatches.filter(b => b.status === BatchStatus.EXPIRED).length; }

  private initCreateForm(): CreateBatchRequest {
    return {
      product_id: '',
      batch_number: '',
      manufacturing_date: new Date().toISOString().slice(0, 10),
      expiry_date: '',
      status: BatchStatus.ACTIVE,
    };
  }

  private enrichBatch(batch: BatchResponse): BatchResponse {
    const product = this.products.find((item) => item.id === batch.product_id);

    return {
      ...batch,
      product_name: product?.name || batch.product_name,
      product_sku: product?.sku || batch.product_sku,
    };
  }

  private applyFilters(): void {
    const keyword = this.searchKeyword.trim().toLowerCase();
    let filtered = [...this.allBatches];

    if (keyword) {
      filtered = filtered.filter((batch) =>
        batch.batch_number.toLowerCase().includes(keyword)
        || (batch.product_name || '').toLowerCase().includes(keyword)
        || (batch.product_sku || '').toLowerCase().includes(keyword)
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter((batch) => batch.status === this.selectedStatus);
    }

    this.totalElements = filtered.length;
    this.totalPages = this.totalElements === 0 ? 0 : Math.ceil(this.totalElements / this.pageSize);

    const start = this.currentPage * this.pageSize;
    this.batches = filtered.slice(start, start + this.pageSize);
  }
}

