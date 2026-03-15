import { Component, OnInit } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { BatchResponse } from '../../dto/response/Batch/BatchResponse';
import { BatchService } from '../../service/BatchService/batch.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { BatchStatus } from '../../helper/enums/BatchStatus';
import { ChangeBatchStatusRequest, CreateBatchRequest } from '../../dto/request/Batch/BatchRequest';
import { ProductService } from '../../service/ProductService/product.service';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { ProductStatus } from '../../helper/enums/ProductStatus';

@Component({
  selector: 'app-batch',
  templateUrl: './batch.component.html',
  styleUrls: ['./batch.component.css']
})
export class BatchComponent implements OnInit {
  allBatches: BatchResponse[] = [];
  batches: BatchResponse[] = [];
  trackedProducts: ProductResponse[] = [];
  creatableProducts: ProductResponse[] = [];

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  loadingProducts = false;
  detailLoading = false;
  viewMode: 'grid' | 'list' = 'list';

  searchKeyword = '';
  selectedStatus: '' | BatchStatus = '';
  selectedProductId = '';

  showCreateModal = false;
  showDetailModal = false;
  showStatusModal = false;

  selectedBatch: BatchResponse | null = null;
  selectedStatusOptions: BatchStatus[] = [];

  createForm: CreateBatchRequest = this.initCreateForm();
  statusForm: ChangeBatchStatusRequest = { status: BatchStatus.AVAILABLE };

  readonly BatchStatus = BatchStatus;

  constructor(
    private batchService: BatchService,
    private productService: ProductService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadBatchTrackedProducts();
    this.loadBatches();
  }

  loadBatches(): void {
    this.loading = true;

    this.fetchAllBatches().subscribe({
      next: (batches) => {
        this.allBatches = batches
          .map((batch) => this.enrichBatch(batch))
          .sort((left, right) => right.updated_at.localeCompare(left.updated_at));

        this.applyFilters();

        if (this.selectedBatch) {
          const latest = this.allBatches.find((item) => item.id === this.selectedBatch?.id);
          this.selectedBatch = latest ? latest : this.enrichBatch(this.selectedBatch);
        }

        this.loading = false;
      },
      error: (error) => {
        this.allBatches = [];
        this.batches = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
        this.toastr.error(error?.error?.message || 'Không tải được danh sách lô.');
      }
    });
  }

  loadBatchTrackedProducts(): void {
    this.loadingProducts = true;

    this.fetchAllBatchTrackedProducts().subscribe({
      next: (products) => {
        this.trackedProducts = [...products].sort((left, right) =>
          `${left.sku} ${left.name}`.localeCompare(`${right.sku} ${right.name}`)
        );
        this.creatableProducts = this.trackedProducts.filter(
          (product) => product.requires_batch_tracking && product.status === ProductStatus.ACTIVE
        );

        this.allBatches = this.allBatches.map((batch) => this.enrichBatch(batch));
        this.batches = this.batches.map((batch) => this.enrichBatch(batch));
        this.selectedBatch = this.selectedBatch ? this.enrichBatch(this.selectedBatch) : null;
        this.loadingProducts = false;
      },
      error: (error) => {
        this.trackedProducts = [];
        this.creatableProducts = [];
        this.loadingProducts = false;
        this.toastr.error(error?.error?.message || 'Không tải được danh sách sản phẩm theo dõi lô.');
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
    this.selectedProductId = '';
    this.currentPage = 0;
    this.applyFilters();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.applyFilters();
  }

  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    const request = this.normalizeCreateRequest();
    if (!this.validateCreateRequest(request)) {
      return;
    }

    this.batchService.create(request).subscribe({
      next: (res) => {
        if (res.success) {
          const createdBatch = this.enrichBatch(res.data);
          this.toastr.success('Tạo lô thành công.');
          this.closeCreateModal();
          this.replaceBatchInState(createdBatch, true);
          this.openDetailModal(createdBatch);
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Tạo lô thất bại.');
      }
    });
  }

  openDetailModal(batch: BatchResponse): void {
    this.selectedBatch = this.enrichBatch(batch);
    this.showDetailModal = true;
    this.loadBatchDetail(batch.id);
  }

  loadBatchDetail(batchId: string): void {
    this.detailLoading = true;

    this.batchService.getById(batchId).subscribe({
      next: (res) => {
        if (res.success) {
          const batch = this.enrichBatch(res.data);
          this.selectedBatch = batch;
          this.replaceBatchInState(batch);
        }
        this.detailLoading = false;
      },
      error: (error) => {
        this.detailLoading = false;
        this.toastr.error(error?.error?.message || 'Không tải được chi tiết lô.');
      }
    });
  }

  openStatusModal(batch: BatchResponse): void {
    this.selectedBatch = this.enrichBatch(batch);
    this.selectedStatusOptions = this.getAvailableStatusOptions(this.selectedBatch);
    this.statusForm = {
      status: this.selectedStatusOptions.find((status) => status !== this.selectedBatch?.status)
        || this.selectedBatch.status
    };
    this.showStatusModal = true;
  }

  onStatusSubmit(): void {
    if (!this.selectedBatch) {
      return;
    }

    if (this.statusForm.status === this.selectedBatch.status) {
      this.toastr.warning('Vui lòng chọn trạng thái mới cho lô.');
      return;
    }

    if (!this.selectedStatusOptions.includes(this.statusForm.status)) {
      this.toastr.warning('Trạng thái được chọn không phù hợp với lô hiện tại.');
      return;
    }

    this.batchService.changeStatus(this.selectedBatch.id, this.statusForm).subscribe({
      next: (res) => {
        if (res.success) {
          const updatedBatch = this.enrichBatch(res.data);
          this.toastr.success('Cập nhật trạng thái lô thành công.');
          this.closeStatusModal();
          this.replaceBatchInState(updatedBatch, true);
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Cập nhật trạng thái lô thất bại.');
      }
    });
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createForm = this.initCreateForm();
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedBatch = null;
    this.detailLoading = false;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedStatusOptions = [];
    this.statusForm = { status: BatchStatus.AVAILABLE };
  }

  canChangeStatus(batch: BatchResponse): boolean {
    return this.getAvailableStatusOptions(batch).some((status) => status !== batch.status);
  }

  getStatusLabel(status: BatchStatus): string {
    const labels: Record<BatchStatus, string> = {
      [BatchStatus.AVAILABLE]: 'Sẵn dùng',
      [BatchStatus.QUARANTINE]: 'Cách ly',
      [BatchStatus.EXPIRED]: 'Hết hạn',
      [BatchStatus.RECALLED]: 'Thu hồi'
    };
    return labels[status];
  }

  getStatusClass(status: BatchStatus): string {
    const classes: Record<BatchStatus, string> = {
      [BatchStatus.AVAILABLE]: 'badge-available',
      [BatchStatus.QUARANTINE]: 'badge-quarantine',
      [BatchStatus.EXPIRED]: 'badge-expired',
      [BatchStatus.RECALLED]: 'badge-recalled'
    };
    return classes[status];
  }

  getProductLabel(product: ProductResponse): string {
    return `${product.sku} - ${product.name}`;
  }

  get availableCount(): number {
    return this.allBatches.filter((batch) => batch.status === BatchStatus.AVAILABLE).length;
  }

  get quarantineCount(): number {
    return this.allBatches.filter((batch) => batch.status === BatchStatus.QUARANTINE).length;
  }

  get expiredCount(): number {
    return this.allBatches.filter((batch) => batch.status === BatchStatus.EXPIRED).length;
  }

  get recalledCount(): number {
    return this.allBatches.filter((batch) => batch.status === BatchStatus.RECALLED).length;
  }

  isPastExpiryDate(batch: BatchResponse | null): boolean {
    const expiryDate = this.toDateOnly(batch?.expiry_date);
    if (!expiryDate) {
      return false;
    }

    return expiryDate < this.today();
  }

  isExpiringSoon(batch: BatchResponse | null, days = 30): boolean {
    const expiryDate = this.toDateOnly(batch?.expiry_date);
    if (!expiryDate) {
      return false;
    }

    const today = this.today();
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() + days);

    return expiryDate >= today && expiryDate <= threshold;
  }

  getStatusChangeHint(batch: BatchResponse | null): string {
    if (!batch) {
      return '';
    }

    if (batch.status === BatchStatus.RECALLED) {
      return 'Lô đã ở trạng thái thu hồi. Màn hình này không mở lại lô đã thu hồi.';
    }

    if (batch.status === BatchStatus.EXPIRED || this.isPastExpiryDate(batch)) {
      return 'Lô đã quá hạn theo ngày hoặc đang ở trạng thái hết hạn. Chỉ nên chuyển sang Hết hạn hoặc Thu hồi.';
    }

    if (batch.status === BatchStatus.QUARANTINE) {
      return 'Lô đang bị cách ly. Chỉ chuyển về Sẵn dùng khi đã hoàn tất đánh giá chất lượng.';
    }

    return 'Lô đang sẵn dùng. Có thể chuyển sang Cách ly, Hết hạn hoặc Thu hồi tùy theo tình huống nghiệp vụ.';
  }

  private fetchAllBatches(): Observable<BatchResponse[]> {
    const pageSize = 100;

    return this.batchService.getAll(0, pageSize).pipe(
      switchMap((response) => {
        if (!response.success) {
          return of([]);
        }

        const firstPage = response.data.content || [];
        if (response.data.total_pages <= 1) {
          return of(firstPage);
        }

        const remainingRequests = Array.from({ length: response.data.total_pages - 1 }, (_, index) =>
          this.batchService.getAll(index + 1, pageSize).pipe(
            map((pageResponse) => pageResponse.success ? pageResponse.data.content : []),
            catchError(() => of([]))
          )
        );

        return forkJoin(remainingRequests).pipe(
          map((pages) => firstPage.concat(...pages))
        );
      })
    );
  }

  private fetchAllBatchTrackedProducts(): Observable<ProductResponse[]> {
    const pageSize = 100;

    return this.productService.getBatchTracking(0, pageSize).pipe(
      switchMap((response) => {
        if (!response.success) {
          return of([]);
        }

        const firstPage = response.data.content || [];
        if (response.data.total_pages <= 1) {
          return of(firstPage);
        }

        const remainingRequests = Array.from({ length: response.data.total_pages - 1 }, (_, index) =>
          this.productService.getBatchTracking(index + 1, pageSize).pipe(
            map((pageResponse) => pageResponse.success ? pageResponse.data.content : []),
            catchError(() => of([]))
          )
        );

        return forkJoin(remainingRequests).pipe(
          map((pages) => firstPage.concat(...pages))
        );
      })
    );
  }

  private initCreateForm(): CreateBatchRequest {
    return {
      product_id: '',
      batch_number: '',
      manufacturing_date: new Date().toISOString().slice(0, 10),
      expiry_date: '',
      supplier_batch_number: '',
      status: BatchStatus.AVAILABLE,
      notes: ''
    };
  }

  private normalizeCreateRequest(): CreateBatchRequest {
    return {
      product_id: this.createForm.product_id,
      batch_number: this.createForm.batch_number.trim(),
      manufacturing_date: this.createForm.manufacturing_date,
      expiry_date: this.createForm.expiry_date || undefined,
      supplier_batch_number: this.createForm.supplier_batch_number?.trim() || undefined,
      status: BatchStatus.AVAILABLE,
      notes: this.createForm.notes?.trim() || undefined
    };
  }

  private validateCreateRequest(request: CreateBatchRequest): boolean {
    if (this.loadingProducts) {
      this.toastr.warning('Danh sách sản phẩm theo dõi lô đang được tải. Vui lòng thử lại sau.');
      return false;
    }

    if (!request.product_id) {
      this.toastr.warning('Vui lòng chọn sản phẩm.');
      return false;
    }

    const selectedProduct = this.creatableProducts.find((product) => product.id === request.product_id);
    if (!selectedProduct) {
      this.toastr.warning('Sản phẩm đã chọn không hợp lệ hoặc không hỗ trợ theo dõi lô.');
      return false;
    }

    if (!request.batch_number) {
      this.toastr.warning('Vui lòng nhập mã lô.');
      return false;
    }

    if (request.batch_number.length > 50) {
      this.toastr.warning('Mã lô không được vượt quá 50 ký tự.');
      return false;
    }

    if (request.supplier_batch_number && request.supplier_batch_number.length > 50) {
      this.toastr.warning('Mã lô của nhà cung cấp không được vượt quá 50 ký tự.');
      return false;
    }

    const manufacturingDate = this.toDateOnly(request.manufacturing_date);
    if (!manufacturingDate) {
      this.toastr.warning('Vui lòng chọn ngày sản xuất.');
      return false;
    }

    if (manufacturingDate > this.today()) {
      this.toastr.warning('Ngày sản xuất không được ở tương lai.');
      return false;
    }

    const expiryDate = this.toDateOnly(request.expiry_date);
    if (expiryDate && expiryDate < manufacturingDate) {
      this.toastr.warning('Hạn sử dụng phải sau hoặc bằng ngày sản xuất.');
      return false;
    }

    return true;
  }

  private getAvailableStatusOptions(batch: BatchResponse): BatchStatus[] {
    const options = new Set<BatchStatus>([batch.status]);
    const expiredByDate = this.isPastExpiryDate(batch);

    if (batch.status === BatchStatus.RECALLED) {
      return Array.from(options);
    }

    if (batch.status === BatchStatus.EXPIRED || expiredByDate) {
      options.add(BatchStatus.EXPIRED);
      options.add(BatchStatus.RECALLED);
      return Array.from(options);
    }

    options.add(BatchStatus.AVAILABLE);
    options.add(BatchStatus.QUARANTINE);
    options.add(BatchStatus.EXPIRED);
    options.add(BatchStatus.RECALLED);

    return Array.from(options);
  }

  private enrichBatch(batch: BatchResponse): BatchResponse {
    const product = this.trackedProducts.find((item) => item.id === batch.product_id);

    return {
      ...batch,
      product_name: product?.name || batch.product_name,
      product_sku: product?.sku || batch.product_sku
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
        || (batch.supplier_batch_number || '').toLowerCase().includes(keyword)
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter((batch) => batch.status === this.selectedStatus);
    }

    if (this.selectedProductId) {
      filtered = filtered.filter((batch) => batch.product_id === this.selectedProductId);
    }

    this.totalElements = filtered.length;
    this.totalPages = this.totalElements === 0 ? 0 : Math.ceil(this.totalElements / this.pageSize);

    if (this.currentPage >= this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages - 1;
    }

    if (this.totalPages === 0) {
      this.currentPage = 0;
    }

    const start = this.currentPage * this.pageSize;
    this.batches = filtered.slice(start, start + this.pageSize);
  }

  private replaceBatchInState(batch: BatchResponse, keepSelected = false): void {
    const existingIndex = this.allBatches.findIndex((item) => item.id === batch.id);

    if (existingIndex >= 0) {
      this.allBatches = this.allBatches.map((item) => item.id === batch.id ? batch : item);
    } else {
      this.allBatches = [batch, ...this.allBatches];
    }

    this.allBatches.sort((left, right) => right.updated_at.localeCompare(left.updated_at));
    this.applyFilters();

    if (keepSelected) {
      this.selectedBatch = batch;
    }
  }

  private toDateOnly(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  private today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
