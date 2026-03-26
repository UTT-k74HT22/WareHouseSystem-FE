import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { OutboundShipmentsResponse } from '../../dto/response/OutboundShipment/OutboundShipmentResponse';
import { OutboundShipmentLinesResponse } from '../../dto/response/OutboundShipmentLine/OutboundShipmentLineResponse';
import { SalesOrderLineResponse } from '../../dto/response/SalesOrderLine/SalesOrderLineResponse';
import { SalesOrderResponse } from '../../dto/response/SalesOrder/SalesOrderResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { OutboundShipmentStatus } from '../../helper/enums/OutboundShipmentStatus';
import { OrderStatus } from '../../helper/enums/OrderStatus';
import { OutboundShipmentLineService } from '../../service/OutboundShipmentLineService/outbound-shipment-line.service';
import { OutboundService } from '../../service/OutboundService/outbound.service';
import { ProductService } from '../../service/ProductService/product.service';
import { SalesOrderService } from '../../service/SalesOrderService/sales-order.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';

type ShipmentDetail = OutboundShipmentsResponse & { lines: OutboundShipmentLinesResponse[] };

@Component({
  selector: 'app-outbound',
  templateUrl: './outbound.component.html',
  styleUrls: ['./outbound.component.css']
})
export class OutboundComponent implements OnInit {
  shipments: OutboundShipmentsResponse[] = [];
  confirmedOrders: SalesOrderResponse[] = [];
  selectedOrder: SalesOrderResponse | null = null;
  selectedOrderLines: SalesOrderLineResponse[] = [];
  products: ProductResponse[] = [];
  warehouses: WareHouseResponse[] = [];

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';
  detailTab: 'header' | 'lines' = 'header';

  searchKeyword = '';
  selectedStatus: '' | OutboundShipmentStatus = '';

  showCreateModal = false;
  showDetailModal = false;
  selectedShipment: ShipmentDetail | null = null;

  createForm: FormGroup;
  OutboundShipmentStatus = OutboundShipmentStatus;

  draftCount = 0;
  pickingCount = 0;
  shippedCount = 0;

  constructor(
    private fb: FormBuilder,
    private outboundService: OutboundService,
    private oblService: OutboundShipmentLineService,
    private soService: SalesOrderService,
    private warehouseService: WarehouseService,
    private toastr: ToastrService,
    private productService: ProductService
  ) {
    this.createForm = this.fb.group({
      sales_order_id: ['', Validators.required],
      warehouse_id: ['', Validators.required],
      shipment_date: [new Date().toISOString().slice(0, 10), Validators.required],
      carrier: [''],
      notes: [''],
      lines: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadShipments();
    this.loadConfirmedOrders();
    this.loadWarehouses();
    this.loadProducts();
  }

  get lines(): FormArray {
    return this.createForm.get('lines') as FormArray;
  }

  loadShipments(): void {
    this.loading = true;
    const filters = {
      shipmentNumber: this.searchKeyword.trim() || undefined,
      status: this.selectedStatus || undefined,
      sort: 'updatedAt,desc'
    };

    this.outboundService.getAll(filters, this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.shipments = res.data.content || [];
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
          this.calculateStats();
        }
        this.loading = false;
      },
      error: (error) => {
        this.shipments = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
        this.toastr.error(error?.error?.message || 'Không thể tải danh sách phiếu xuất kho.');
      }
    });
  }

  loadConfirmedOrders(): void {
    forkJoin([
      this.soService.getAll({ status: OrderStatus.CONFIRMED }, 0, 100),
      this.soService.getAll({ status: OrderStatus.PARTIALLY_SHIPPED }, 0, 100)
    ]).subscribe({
      next: ([confirmedRes, partialRes]) => {
        const merged = [
          ...(confirmedRes.success ? confirmedRes.data.content : []),
          ...(partialRes.success ? partialRes.data.content : [])
        ];

        const orderMap = new Map<string, SalesOrderResponse>();
        merged.forEach((order) => {
          if (order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED) {
            orderMap.set(order.id, order);
          }
        });
        this.confirmedOrders = Array.from(orderMap.values());
      },
      error: () => {
        this.confirmedOrders = [];
        this.toastr.error('Không thể tải danh sách đơn bán hàng có thể xuất kho.');
      }
    });
  }

  loadWarehouses(): void {
    this.warehouseService.getList().subscribe({
      next: (res) => {
        if (res.success) {
          this.warehouses = res.data;
        }
      },
      error: () => {
        this.warehouses = [];
      }
    });
  }

  loadProducts(): void {
    this.productService.getAll(0, 300).subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data.content || [];
        }
      },
      error: () => {
        this.products = [];
      }
    });
  }

  calculateStats(): void {
    this.draftCount = this.shipments.filter((shipment) => this.getShipmentStatus(shipment) === OutboundShipmentStatus.DRAFT).length;
    this.pickingCount = this.shipments.filter((shipment) => {
      const status = this.getShipmentStatus(shipment);
      return status === OutboundShipmentStatus.PICKING || status === OutboundShipmentStatus.PACKED || status === OutboundShipmentStatus.STAGING;
    }).length;
    this.shippedCount = this.shipments.filter((shipment) => this.getShipmentStatus(shipment) === OutboundShipmentStatus.SHIPPED).length;
  }

  onOrderSelect(orderId: string): void {
    this.selectedOrder = null;
    this.selectedOrderLines = [];
    this.lines.clear();

    if (!orderId) {
      this.createForm.patchValue({ warehouse_id: '' });
      return;
    }

    this.soService.getById(orderId).subscribe({
      next: (res) => {
        if (!res.success) {
          return;
        }

        this.selectedOrder = res.data;
        this.createForm.patchValue({ warehouse_id: res.data.warehouse_id });
        this.selectedOrderLines = (res.data.lines || []).filter((line) =>
          Number(line.quantity_ordered) > Number(line.quantity_shipped || 0)
        );

        if (this.selectedOrderLines.length === 0) {
          this.toastr.warning('Đơn bán hàng này không còn số lượng để xuất kho.');
          return;
        }

        this.selectedOrderLines.forEach((line) => {
          this.lines.push(this.buildLineForm(line));
        });
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Không thể tải chi tiết đơn bán hàng.');
      }
    });
  }

  buildLineForm(soLine: SalesOrderLineResponse): FormGroup {
    const remaining = Number(soLine.quantity_ordered) - Number(soLine.quantity_shipped || 0);
    const product = this.products.find((p) => p.id === soLine.product_id);
    
    return this.fb.group({
      sales_order_line_id: [soLine.id, Validators.required],
      product_id: [soLine.product_id, Validators.required],
      product_name: [soLine.product_name || product?.name || 'Không rõ tên'],
      product_sku: [soLine.product_sku || product?.sku || 'N/A'],
      qty_ordered: [soLine.quantity_ordered],
      qty_shipped_total: [soLine.quantity_shipped || 0],
      qty_remaining: [remaining],
      quantity_shipped: [remaining, [Validators.required, Validators.min(0.01), Validators.max(remaining)]],
      notes: ['']
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadShipments();
  }

  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedStatus = '';
    this.currentPage = 0;
    this.loadShipments();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadShipments();
  }

  openCreateModal(): void {
    this.createForm.reset({
      sales_order_id: '',
      warehouse_id: '',
      shipment_date: new Date().toISOString().slice(0, 10),
      carrier: '',
      notes: ''
    });
    this.selectedOrder = null;
    this.selectedOrderLines = [];
    this.lines.clear();
    this.loadConfirmedOrders();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.toastr.warning('Vui lòng điền đầy đủ thông tin hợp lệ.');
      return;
    }

    const validLines = this.lines.controls
      .map((control) => control.value)
      .filter((line) => Number(line.quantity_shipped) > 0);

    if (validLines.length === 0) {
      this.toastr.warning('Phiếu xuất phải có ít nhất một dòng hàng hợp lệ.');
      return;
    }

    const { lines, ...shipmentData } = this.createForm.value;
    this.loading = true;
    this.outboundService.create(shipmentData).subscribe({
      next: (res) => {
        if (!res.success) {
          this.loading = false;
          return;
        }

        const shipmentId = res.data.id;
        const lineRequests = validLines.map((line: any) =>
          this.oblService.create({
            outbound_shipment_id: shipmentId,
            sales_order_line_id: line.sales_order_line_id,
            product_id: line.product_id,
            quantity_shipped: Number(line.quantity_shipped),
            notes: line.notes || undefined
          })
        );

        forkJoin(lineRequests).subscribe({
          next: () => {
            this.toastr.success('Tạo phiếu xuất kho thành công.');
            this.showCreateModal = false;
            this.loading = false;
            this.loadShipments();
            this.loadConfirmedOrders();
            this.openDetailModal(res.data);
          },
          error: (error) => {
            this.loading = false;
            this.toastr.error(error?.error?.message || 'Tạo dòng phiếu xuất thất bại.');
          }
        });
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error(error?.error?.message || 'Có lỗi xảy ra khi tạo phiếu xuất.');
      }
    });
  }

  openDetailModal(shipment: OutboundShipmentsResponse): void {
    this.loading = true;
    this.detailTab = 'header';

    const shipmentId = shipment.id;
    const salesOrderId = shipment.sales_order_id || shipment.salesOrderId || '';

    const requests: any = {
      shipment: this.outboundService.getById(shipmentId),
      lines: this.oblService.getByShipmentId(shipmentId)
    };

    if (salesOrderId) {
      requests.order = this.soService.getById(salesOrderId);
    }

    forkJoin(requests).subscribe({
      next: (res: any) => {
        if (res.shipment.success) {
          this.selectedShipment = {
            ...res.shipment.data,
            lines: res.shipment.data.lines || (res.lines.success ? res.lines.data : [])
          };
          
          if (res.order && res.order.success) {
            this.selectedOrder = res.order.data;
          }
          
          this.showDetailModal = true;
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error(error?.error?.message || 'Không thể tải chi tiết phiếu xuất.');
      }
    });
  }

  startPicking(id: string): void {
    this.loading = true;
    this.outboundService.startPicking(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã bắt đầu lấy hàng.');
          this.refreshDetail(id);
          this.loadShipments();
        } else {
          this.loading = false;
          this.toastr.error(res.message || 'Không thể bắt đầu lấy hàng.');
        }
      },
      error: (error) => {
        this.loading = false;
        const msg = error?.error?.message || 'Không thể bắt đầu lấy hàng.';
        const code = error?.error?.errorCode ? ` [${error.error.errorCode}]` : '';
        this.toastr.error(msg + code);
      }
    });
  }

  markAsPacked(id: string): void {
    this.loading = true;
    this.outboundService.markAsPacked(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã hoàn tất đóng gói.');
          this.refreshDetail(id);
          this.loadShipments();
        } else {
          this.loading = false;
          this.toastr.error(res.message || 'Không thể đóng gói.');
        }
      },
      error: (error) => {
        this.loading = false;
        const msg = error?.error?.message || 'Không thể đóng gói.';
        const code = error?.error?.errorCode ? ` [${error.error.errorCode}]` : '';
        this.toastr.error(msg + code);
      }
    });
  }

  ship(id: string): void {
    this.loading = true;
    this.outboundService.ship(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xác nhận xuất kho thành công.');
          this.refreshDetail(id);
          this.loadShipments();
          this.loadConfirmedOrders();
        } else {
          this.loading = false;
          this.toastr.error(res.message || 'Xuất kho thất bại.');
        }
      },
      error: (error) => {
        this.loading = false;
        const msg = error?.error?.message || 'Xuất kho thất bại.';
        const code = error?.error?.errorCode ? ` [${error.error.errorCode}]` : '';
        this.toastr.error(msg + code);
      }
    });
  }

  cancelShipment(id: string): void {
    this.loading = true;
    this.outboundService.cancel(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Hủy phiếu xuất thành công.');
          this.refreshDetail(id);
          this.loadShipments();
          this.loadConfirmedOrders();
        } else {
          this.loading = false;
        }
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error(error?.error?.message || 'Hủy phiếu xuất thất bại.');
      }
    });
  }

  confirmDispatch(id: string): void {
    this.loading = true;
    this.outboundService.confirmDispatch(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xác nhận giao hàng thành công.');
          this.refreshDetail(id);
          this.loadShipments();
          this.loadConfirmedOrders();
        } else {
          this.loading = false;
          this.toastr.error(res.message || 'Xác nhận giao hàng thất bại.');
        }
      },
      error: (error) => {
        this.loading = false;
        const msg = error?.error?.message || 'Xác nhận giao hàng thất bại.';
        const code = error?.error?.errorCode ? ` [${error.error.errorCode}]` : '';
        this.toastr.error(msg + code);
      }
    });
  }

  refreshDetail(id: string): void {
    forkJoin({
      shipment: this.outboundService.getById(id),
      lines: this.oblService.getByShipmentId(id)
    }).subscribe({
      next: ({ shipment: shipmentRes, lines: linesRes }) => {
        if (shipmentRes.success) {
          this.selectedShipment = {
            ...shipmentRes.data,
            lines: shipmentRes.data.lines || (linesRes.success ? linesRes.data : [])
          };
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error(error?.error?.message || 'Không thể cập nhật chi tiết phiếu xuất.');
      }
    });
  }

  syncSelectedShipment(updated: OutboundShipmentsResponse, includeLines = false): void {
    if (!this.selectedShipment || this.selectedShipment.id !== updated.id) {
      return;
    }
    this.selectedShipment = {
      ...this.selectedShipment,
      ...updated,
      lines: includeLines ? (updated.lines || this.selectedShipment.lines || []) : (this.selectedShipment.lines || [])
    };
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showDetailModal = false;
    this.selectedShipment = null;
    this.selectedOrder = null;
  }

  getShipmentNumber(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.shipment_number || shipment?.shipmentNumber || 'N/A';
  }

  getSalesOrderId(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.sales_order_id || shipment?.salesOrderId || '';
  }

  getWarehouseId(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.warehouse_id || shipment?.warehouseId || '';
  }

  getShipmentDate(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.shipment_date || shipment?.shipmentDate || '';
  }

  getTrackingNumber(shipment: OutboundShipmentsResponse | null | undefined): string | null {
    return shipment?.tracking_number || shipment?.trackingNumber || null;
  }

  getShipmentStatus(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.status || '';
  }

  getLineProductName(line: OutboundShipmentLinesResponse): string {
    if (line.product_name || line.productName) return line.product_name || line.productName || '';
    
    const productId = line.product_id || line.productId;
    if (productId) {
      const product = this.products.find(p => p.id === productId);
      if (product) return product.name;
    }
    
    return 'Không rõ sản phẩm';
  }

  getLineBatchNumber(line: OutboundShipmentLinesResponse): string | null {
    return line.batch_number || line.batchNumber || null;
  }

  getLineLocationName(line: OutboundShipmentLinesResponse): string {
    const locName = line.location_name || line.locationName;
    if (locName) return locName;

    return 'Thông tin kho chưa cập nhật';
  }

  getLineQuantity(line: OutboundShipmentLinesResponse): number {
    return Number(line.quantity_shipped ?? line.quantityShipped ?? 0);
  }

  getLinePickedAt(line: OutboundShipmentLinesResponse): string | null {
    return line.picked_at || line.pickedAt || null;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Nháp',
      PICKING: 'Đang lấy hàng',
      PACKED: 'Đã đóng gói',
      STAGING: 'Chờ giao',
      SHIPPED: 'Đã xuất kho',
      CANCELLED: 'Đã hủy'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      DRAFT: 'badge-draft',
      PICKING: 'badge-progress',
      PACKED: 'badge-confirmed',
      STAGING: 'badge-progress',
      SHIPPED: 'badge-completed',
      CANCELLED: 'badge-cancelled'
    };
    return classes[status] || 'badge-default';
  }

  getWarehouseName(id: string): string {
    const warehouse = this.warehouses.find((item) => item.id === id);
    return warehouse ? warehouse.name : id;
  }

  getSelectedWarehouseName(): string {
    const warehouseId = this.createForm.get('warehouse_id')?.value;
    return warehouseId ? this.getWarehouseName(warehouseId) : '';
  }

  getSalesOrderDisplay(orderId: string): string {
    const order = this.confirmedOrders.find((item) => item.id === orderId);
    return order ? order.so_number : orderId;
  }

  getSalesOrderLineProductDisplay(line: SalesOrderLineResponse): string {
    const product = this.products.find((item) => item.id === line.product_id);
    if (line.product_name && line.product_sku) {
      return `${line.product_sku} - ${line.product_name}`;
    }
    if (line.product_name) {
      return line.product_name;
    }
    if (product) {
      return `${product.sku} - ${product.name}`;
    }
    return line.product_sku || line.product_id;
  }

  getOrderStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Nháp',
      CONFIRMED: 'Đã xác nhận',
      PARTIALLY_SHIPPED: 'Giao một phần',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy'
    };
    return labels[status] || status;
  }

  getShipmentStep(): number {
    if (!this.selectedShipment) return 0;
    const status = this.getShipmentStatus(this.selectedShipment);
    switch (status) {
      case 'DRAFT': return 1;
      case 'PICKING': return 2;
      case 'PACKED': return 3;
      case 'STAGING': return 4;
      case 'SHIPPED': return 5;
      default: return 0;
    }
  }

  getFlowStepTitle(): string {
    const step = this.getShipmentStep();
    switch (step) {
      case 1: return 'Chờ bắt đầu soạn hàng';
      case 2: return 'Đang thực hiện lấy hàng';
      case 3: return 'Đang đóng gói hàng hóa';
      case 4: return 'Hàng đang chờ giao';
      case 5: return 'Đã hoàn tất xuất kho';
      default: return 'Phiếu đã hủy';
    }
  }

  getTotalQuantity(): number {
    if (!this.selectedShipment || !this.selectedShipment.lines) return 0;
    return this.selectedShipment.lines.reduce((sum, line) => sum + this.getLineQuantity(line), 0);
  }

  getLinePickedBy(line: OutboundShipmentLinesResponse): string | null {
    return line.picked_by || line.pickedBy || null;
  }

  getCreatedBy(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.created_by || shipment?.createdBy || 'System';
  }

  getCreatedAt(shipment: OutboundShipmentsResponse | null | undefined): string | null {
    return shipment?.created_at || shipment?.createdAt || null;
  }

  getUpdatedBy(shipment: OutboundShipmentsResponse | null | undefined): string | null {
    return shipment?.updated_by || shipment?.updatedBy || null;
  }

  getUpdatedAt(shipment: OutboundShipmentsResponse | null | undefined): string | null {
    return shipment?.updated_at || shipment?.updatedAt || null;
  }

  getConfirmedBy(shipment: OutboundShipmentsResponse | null | undefined): string | null {
    return shipment?.confirmed_by || shipment?.confirmedBy || null;
  }

  getShippedAt(shipment: OutboundShipmentsResponse | null | undefined): string | null {
    return shipment?.shipped_at || shipment?.shippedAt || null;
  }

  getShipmentFlowLocationText(): string {
    if (!this.selectedShipment) return '';
    const status = this.getShipmentStatus(this.selectedShipment);
    if (status === 'DRAFT') return 'Hàng đang nằm tại các vị trí lưu kho (STORAGE).';
    if (status === 'PICKING') return 'Hàng đang được tập kết tại khu vực soạn hàng (PICKING).';
    if (status === 'PACKED') return 'Hàng đã được chuyển đến bàn đóng gói (PACKING).';
    if (status === 'STAGING') return 'Hàng đang chờ tại khu vực chờ giao (STAGING).';
    if (status === 'SHIPPED') return 'Hàng đã rời khỏi kho.';
    return 'Quy trình đã dừng.';
  }
}
