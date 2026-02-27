import { Component, OnInit } from '@angular/core';
import { StockMovementResponse } from '../../dto/response/Stock/StockMovementResponse';
import { StockAdjustmentResponse } from '../../dto/response/Stock/StockAdjustmentResponse';
import { StockTransferResponse } from '../../dto/response/Stock/StockTransferResponse';
import {
  StockMovementService,
  StockAdjustmentService,
  StockTransferService
} from '../../service/StockService/stock.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { StockMovementType } from '../../helper/enums/StockMovementType';
import { StockAdjustmentType } from '../../helper/enums/StockAdjustmentType';
import { CreateStockAdjustmentRequest } from '../../dto/request/Stock/CreateStockAdjustmentRequest';
import { CreateStockTransferRequest } from '../../dto/request/Stock/CreateStockTransferRequest';
import {
  MOCK_STOCK_MOVEMENTS, MOCK_STOCK_ADJUSTMENTS, MOCK_STOCK_TRANSFERS, mockPage
} from '../../helper/mock/mock-data';

/** ──────────────────────────────────────────────────────────────
 *  Stock Movements (Lịch sử chuyển động kho - Read Only)
 * ────────────────────────────────────────────────────────────── */
@Component({
  selector: 'app-stock-movements',
  templateUrl: './stock-movements.component.html',
  styleUrls: ['./stock-movements.component.css']
})
export class StockMovementsComponent implements OnInit {
  movements: StockMovementResponse[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;

  selectedType: '' | StockMovementType = '';
  searchKeyword = '';

  StockMovementType = StockMovementType;

  constructor(
    private movementService: StockMovementService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void { this.loadMovements(); }

  loadMovements(): void {
    this.loading = true;
    this.movementService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.movements = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        const page = mockPage(MOCK_STOCK_MOVEMENTS, this.currentPage, this.pageSize);
        this.movements = page.content;
        this.totalElements = page.total_elements;
        this.totalPages = page.total_pages;
        this.loading = false;
      }
    });
  }

  onSearch(): void { this.currentPage = 0; this.loadMovements(); }
  onResetFilter(): void { this.selectedType = ''; this.searchKeyword = ''; this.loadMovements(); }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadMovements();
  }

  getTypeLabel(type: StockMovementType): string {
    const labels: Record<StockMovementType, string> = {
      [StockMovementType.INBOUND]: 'Nhập kho',
      [StockMovementType.OUTBOUND]: 'Xuất kho',
      [StockMovementType.TRANSFER]: 'Chuyển vị trí',
      [StockMovementType.ADJUSTMENT]: 'Điều chỉnh',
      [StockMovementType.RETURN]: 'Hoàn trả'
    };
    return labels[type];
  }

  getTypeClass(type: StockMovementType): string {
    const classes: Record<StockMovementType, string> = {
      [StockMovementType.INBOUND]: 'badge-inbound',
      [StockMovementType.OUTBOUND]: 'badge-outbound',
      [StockMovementType.TRANSFER]: 'badge-transfer',
      [StockMovementType.ADJUSTMENT]: 'badge-adjustment',
      [StockMovementType.RETURN]: 'badge-return'
    };
    return classes[type];
  }
}

/** ──────────────────────────────────────────────────────────────
 *  Stock Adjustments (Điều chỉnh tồn kho)
 * ────────────────────────────────────────────────────────────── */
@Component({
  selector: 'app-stock-adjustments',
  templateUrl: './stock-adjustments.component.html',
  styleUrls: ['./stock-adjustments.component.css']
})
export class StockAdjustmentsComponent implements OnInit {
  adjustments: StockAdjustmentResponse[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;

  showCreateModal = false;
  createForm: CreateStockAdjustmentRequest = this.initCreateForm();

  StockAdjustmentType = StockAdjustmentType;

  constructor(
    private adjService: StockAdjustmentService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void { this.loadAdjustments(); }

  loadAdjustments(): void {
    this.loading = true;
    this.adjService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.adjustments = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        const page = mockPage(MOCK_STOCK_ADJUSTMENTS, this.currentPage, this.pageSize);
        this.adjustments = page.content;
        this.totalElements = page.total_elements;
        this.totalPages = page.total_pages;
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadAdjustments();
  }

  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    this.adjService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo phiếu điều chỉnh thành công!');
          this.showCreateModal = false;
          this.loadAdjustments();
        }
      }
    });
  }

  closeAllModals(): void { this.showCreateModal = false; }

  private initCreateForm(): CreateStockAdjustmentRequest {
    return { type: StockAdjustmentType.INCREASE, product_id: '', location_id: '', quantity_adjusted: 0, reason: '' };
  }

  getTypeLabel(type: StockAdjustmentType): string {
    const labels: Record<StockAdjustmentType, string> = {
      [StockAdjustmentType.INCREASE]: 'Tăng tồn',
      [StockAdjustmentType.DECREASE]: 'Giảm tồn',
      [StockAdjustmentType.DAMAGE]: 'Hàng hỏng',
      [StockAdjustmentType.LOSS]: 'Thất thoát',
      [StockAdjustmentType.FOUND]: 'Tìm thấy'
    };
    return labels[type];
  }
}

/** ──────────────────────────────────────────────────────────────
 *  Stock Transfers (Chuyển vị trí trong kho)
 * ────────────────────────────────────────────────────────────── */
@Component({
  selector: 'app-stock-transfers',
  templateUrl: './stock-transfers.component.html',
  styleUrls: ['./stock-transfers.component.css']
})
export class StockTransfersComponent implements OnInit {
  transfers: StockTransferResponse[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;

  showCreateModal = false;
  createForm: CreateStockTransferRequest = this.initCreateForm();

  constructor(
    private transferService: StockTransferService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void { this.loadTransfers(); }

  loadTransfers(): void {
    this.loading = true;
    this.transferService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.transfers = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        const page = mockPage(MOCK_STOCK_TRANSFERS, this.currentPage, this.pageSize);
        this.transfers = page.content;
        this.totalElements = page.total_elements;
        this.totalPages = page.total_pages;
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadTransfers();
  }

  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    this.transferService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo phiếu chuyển kho thành công!');
          this.showCreateModal = false;
          this.loadTransfers();
        }
      }
    });
  }

  closeAllModals(): void { this.showCreateModal = false; }

  private initCreateForm(): CreateStockTransferRequest {
    return { product_id: '', from_location_id: '', to_location_id: '', quantity: 0 };
  }
}
