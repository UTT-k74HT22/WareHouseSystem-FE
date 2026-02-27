import { Component, OnInit } from '@angular/core';
import { BatchResponse } from '../../dto/response/Batch/BatchResponse';
import { BatchService } from '../../service/BatchService/batch.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { BatchStatus } from '../../helper/enums/BatchStatus';
import { CreateBatchRequest, UpdateBatchRequest } from '../../dto/request/Batch/BatchRequest';
import { MOCK_BATCHES, mockPage } from '../../helper/mock/mock-data';

@Component({
  selector: 'app-batch',
  templateUrl: './batch.component.html',
  styleUrls: ['./batch.component.css']
})
export class BatchComponent implements OnInit {
  batches: BatchResponse[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;

  searchKeyword = '';
  selectedStatus: '' | BatchStatus = '';

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;

  createForm: CreateBatchRequest = this.initCreateForm();
  editForm: UpdateBatchRequest & { id: string } = { id: '', status: BatchStatus.ACTIVE };
  selectedBatch: BatchResponse | null = null;

  BatchStatus = BatchStatus;

  constructor(
    private batchService: BatchService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void { this.loadBatches(); }

  loadBatches(): void {
    this.loading = true;
    this.batchService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.batches = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        const page = mockPage(MOCK_BATCHES, this.currentPage, this.pageSize);
        this.batches = page.content;
        this.totalElements = page.total_elements;
        this.totalPages = page.total_pages;
        this.loading = false;
      }
    });
  }

  onSearch(): void { this.currentPage = 0; this.loadBatches(); }
  onResetFilter(): void { this.searchKeyword = ''; this.selectedStatus = ''; this.loadBatches(); }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadBatches();
  }

  openCreateModal(): void { this.createForm = this.initCreateForm(); this.showCreateModal = true; }

  openEditModal(b: BatchResponse): void {
    this.selectedBatch = b;
    this.editForm = {
      id: b.id,
      batch_number: b.batch_number,
      manufacture_date: b.manufacture_date,
      expiry_date: b.expiry_date,
      quantity: b.quantity,
      status: b.status,
      notes: b.notes ?? undefined
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
    const { id, ...body } = this.editForm;
    this.batchService.update(id, body).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Cập nhật lô hàng thành công!');
          this.showEditModal = false;
          this.loadBatches();
        }
      }
    });
  }

  onDeleteConfirm(): void {
    if (!this.selectedBatch) return;
    this.batchService.delete(this.selectedBatch.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã xoá lô hàng!');
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

  get activeCount(): number   { return this.batches.filter(b => b.status === BatchStatus.ACTIVE).length; }
  get expiredCount(): number  { return this.batches.filter(b => b.status === BatchStatus.EXPIRED).length; }

  private initCreateForm(): CreateBatchRequest {
    return { product_id: '', batch_number: '', manufacture_date: '', expiry_date: '', quantity: 0 };
  }
}
