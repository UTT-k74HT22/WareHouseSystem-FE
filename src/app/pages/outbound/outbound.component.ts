import { Component, HostListener, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
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
import { BusinessPartnerService } from '../../service/BusinessPartnerService/business-partner.service';

type ShipmentDetail = OutboundShipmentsResponse & { lines: OutboundShipmentLinesResponse[] };

@Component({
  selector: 'app-outbound',
  templateUrl: './outbound.component.html',
  styleUrls: ['./outbound.component.css']
})
export class OutboundComponent implements OnInit {
  createPermissions = ['PERM_OUTBOUND_SHIPMENT_CREATE'];
  updatePermissions = ['PERM_OUTBOUND_SHIPMENT_UPDATE'];

  shipments: OutboundShipmentsResponse[] = [];
  confirmedOrders: SalesOrderResponse[] = [];
  selectedOrder: SalesOrderResponse | null = null;
  selectedOrderLines: SalesOrderLineResponse[] = [];
  products: ProductResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  customers: BusinessPartnerResponse[] = [];

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';
  detailTab: 'header' | 'lines' = 'header';

  searchKeyword = '';
  salesOrderSearchKeyword = '';
  salesOrderSearchFocused = false;
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
    private productService: ProductService,
    private businessPartnerService: BusinessPartnerService
  ) {
    this.createForm = this.fb.group({
      sales_order_id: ['', Validators.required],
      warehouse_id: ['', Validators.required],
      shipment_date: [new Date().toISOString().slice(0, 10), Validators.required],
      shipment_time: [this.getDefaultShipmentTime(), Validators.required],
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
    this.loadCustomers();
  }

  get lines(): FormArray {
    return this.createForm.get('lines') as FormArray;
  }

  private loadSeq = 0;
  private orderSelectionSeq = 0;

  loadShipments(silent = false): void {
    if (!silent) {
      this.loading = true;
      this.loadStats();
    }
    const seq = ++this.loadSeq;
    const filters = {
      shipmentNumber: this.searchKeyword.trim() || undefined,
      status: this.selectedStatus || undefined
    };

    this.outboundService.getAll(filters, this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (seq !== this.loadSeq) {
          return;
        }
        if (res.success) {
          this.shipments = res.data.content || [];
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: (error) => {
        if (seq !== this.loadSeq) {
          return;
        }
        this.shipments = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
        this.toastr.error('Xuất kho', error?.error?.message || 'Không thể tải danh sách phiếu xuất kho.');
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
      error: (error) => {
        this.confirmedOrders = [];
        this.toastr.error('Xuất kho', error?.error?.message || 'Không thể tải danh sách đơn xuất hàng có thể xuất kho.');
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
    this.productService.getFullList().subscribe({
      next: (products) => {
        this.products = products || [];
      },
      error: () => {
        this.products = [];
      }
    });
  }

  loadCustomers(): void {
    this.businessPartnerService.getAll().subscribe({
      next: (res) => {
        this.customers = res.success ? (res.data || []) : [];
      },
      error: () => {
        this.customers = [];
      }
    });
  }

  private loadStats(): void {
    this.outboundService.getStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.draftCount = res.data['draft'] ?? 0;
          this.pickingCount = (res.data['picking'] ?? 0) + (res.data['packed'] ?? 0) + (res.data['staging'] ?? 0);
          this.shippedCount = res.data['shipped'] ?? 0;
        }
      },
      error: () => { /* giữ số cũ khi lỗi */ }
    });
  }

  onOrderSelect(orderId: string): void {
    const selectionSeq = ++this.orderSelectionSeq;
    this.selectedOrder = null;
    this.selectedOrderLines = [];
    this.lines.clear();
    this.createForm.patchValue({ sales_order_id: orderId, warehouse_id: '' });

    if (!orderId) {
      return;
    }

    this.soService.getById(orderId).subscribe({
      next: (res) => {
        if (selectionSeq !== this.orderSelectionSeq) {
          return;
        }
        if (!res.success) {
          return;
        }

        this.selectedOrder = res.data;
        this.createForm.patchValue({ warehouse_id: res.data.warehouse_id });
        this.selectedOrderLines = (res.data.lines || []).filter((line) =>
          Number(line.quantity_ordered) > Number(line.quantity_shipped || 0)
        );

        if (this.selectedOrderLines.length === 0) {
          this.toastr.warning('Xuất kho', 'Đơn xuất hàng này không còn số lượng để xuất kho.');
          return;
        }

        this.selectedOrderLines.forEach((line) => {
          this.lines.push(this.buildLineForm(line));
        });
      },
      error: (error) => {
        if (selectionSeq !== this.orderSelectionSeq) {
          return;
        }
        this.toastr.error('Xuất kho', error?.error?.message || 'Không thể tải chi tiết đơn xuất hàng.');
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
      // Số lượng bằng 0 nghĩa là không xuất sản phẩm này trong đợt hiện tại.
      // Khi lưu phiếu vẫn bắt buộc phải có ít nhất một dòng có số lượng lớn hơn 0.
      quantity_shipped: [remaining, [Validators.required, Validators.min(0), Validators.max(remaining)]],
      notes: ['']
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadShipments(true);
  }

  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedStatus = '';
    this.currentPage = 0;
    this.loadShipments(true);
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
      shipment_time: this.getDefaultShipmentTime(),
      carrier: '',
      notes: ''
    });
    this.salesOrderSearchKeyword = '';
    this.salesOrderSearchFocused = false;
    this.selectedOrder = null;
    this.selectedOrderLines = [];
    this.lines.clear();
    this.loadConfirmedOrders();
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.toastr.warning('Xuất kho', 'Vui lòng điền đầy đủ thông tin hợp lệ.');
      return;
    }

    const validLines = this.lines.controls
      .map((control) => control.value)
      .filter((line) => Number(line.quantity_shipped) > 0);

    if (validLines.length === 0) {
      this.toastr.warning('Xuất kho', 'Phiếu xuất phải có ít nhất một dòng hàng hợp lệ.');
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
            this.toastr.success('Xuất kho', 'Tạo phiếu xuất kho thành công.');
            this.showCreateModal = false;
            this.loading = false;
            this.loadShipments();
            this.loadConfirmedOrders();
            this.openDetailModal(res.data);
          },
          error: (error) => {
            // Bù non-atomic: hủy phiếu DRAFT vừa tạo để không mồ côi dòng lỗi
            const shipmentId = res.data.id;
            this.outboundService.cancel(shipmentId).subscribe({
              next: () => {
                this.loading = false;
                this.toastr.error('Xuất kho', 'Tạo dòng thất bại, đã hủy phiếu vừa tạo.');
                this.showCreateModal = false;
                this.loadShipments();
              },
              error: () => {
                this.loading = false;
                this.toastr.error('Xuất kho', 'Tạo dòng thất bại và không hủy được phiếu. Vui lòng hủy tay phiếu vừa tạo.');
              }
            });
          }
        });
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error('Xuất kho', error?.error?.message || 'Có lỗi xảy ra khi tạo phiếu xuất.');
      }
    });
  }

  openDetailModal(shipment: OutboundShipmentsResponse): void {
    this.loading = true;
    this.detailTab = 'header';

    const shipmentId = shipment.id;
    const salesOrderId = shipment.sales_order_id || '';

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
          const enrichedLines = (res.lines && res.lines.success) ? res.lines.data : (res.shipment.data.lines || []);
          this.selectedShipment = {
            ...res.shipment.data,
            lines: enrichedLines
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
        this.toastr.error('Xuất kho', error?.error?.message || 'Không thể tải chi tiết phiếu xuất.');
      }
    });
  }

  startPicking(id: string): void {
    this.loading = true;
    this.outboundService.startPicking(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xuất kho', 'Đã bắt đầu lấy hàng.');
          this.refreshDetail(id);
          this.loadShipments();
        } else {
          this.loading = false;
          this.toastr.error('Xuất kho', res.message || 'Không thể bắt đầu lấy hàng.');
        }
      },
      error: (error) => {
        this.loading = false;
        const msg = error?.error?.message || 'Không thể bắt đầu lấy hàng.';
        const code = error?.error?.errorCode ? ` [${error.error.errorCode}]` : '';
        this.toastr.error('Xuất kho', msg + code);
      }
    });
  }

  markAsPacked(id: string): void {
    this.loading = true;
    this.outboundService.markAsPacked(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xuất kho', 'Đã hoàn tất đóng gói.');
          this.refreshDetail(id);
          this.loadShipments();
        } else {
          this.loading = false;
          this.toastr.error('Xuất kho', res.message || 'Không thể đóng gói.');
        }
      },
      error: (error) => {
        this.loading = false;
        const msg = error?.error?.message || 'Không thể đóng gói.';
        const code = error?.error?.errorCode ? ` [${error.error.errorCode}]` : '';
        this.toastr.error('Xuất kho', msg + code);
      }
    });
  }

  ship(id: string): void {
    this.loading = true;
    this.outboundService.ship(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xuất kho', 'Xác nhận xuất kho thành công.');
          this.refreshDetail(id);
          this.loadShipments();
          this.loadConfirmedOrders();
        } else {
          this.loading = false;
          this.toastr.error('Xuất kho', res.message || 'Xuất kho thất bại.');
        }
      },
      error: (error) => {
        this.loading = false;
        const msg = error?.error?.message || 'Xuất kho thất bại.';
        const code = error?.error?.errorCode ? ` [${error.error.errorCode}]` : '';
        this.toastr.error('Xuất kho', msg + code);
      }
    });
  }

  cancelShipment(id: string): void {
    this.loading = true;
    this.outboundService.cancel(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xuất kho', 'Hủy phiếu xuất thành công.');
          this.refreshDetail(id);
          this.loadShipments();
          this.loadConfirmedOrders();
        } else {
          this.loading = false;
        }
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error('Xuất kho', error?.error?.message || 'Hủy phiếu xuất thất bại.');
      }
    });
  }

  confirmDispatch(id: string): void {
    this.loading = true;
    this.outboundService.confirmDispatch(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xuất kho', 'Xác nhận giao hàng thành công.');
          this.refreshDetail(id);
          this.loadShipments();
          this.loadConfirmedOrders();
        } else {
          this.loading = false;
          this.toastr.error('Xuất kho', res.message || 'Xác nhận giao hàng thất bại.');
        }
      },
      error: (error) => {
        this.loading = false;
        const msg = error?.error?.message || 'Xác nhận giao hàng thất bại.';
        const code = error?.error?.errorCode ? ` [${error.error.errorCode}]` : '';
        this.toastr.error('Xuất kho', msg + code);
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
        this.toastr.error('Xuất kho', error?.error?.message || 'Không thể cập nhật chi tiết phiếu xuất.');
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
    this.salesOrderSearchKeyword = '';
    this.salesOrderSearchFocused = false;
  }

  getFilteredConfirmedOrders(): SalesOrderResponse[] {
    const keyword = this.normalizeSearchText(this.salesOrderSearchKeyword);
    if (!keyword) {
      return this.confirmedOrders;
    }

    return this.confirmedOrders.filter((order) =>
      this.normalizeSearchText(`${order.so_number} ${this.getCustomerName(order, '')} ${this.getOrderStatusLabel(order.status)}`)
        .includes(keyword)
    );
  }

  getCustomerName(order: SalesOrderResponse | null | undefined, fallback = 'Chưa có thông tin khách hàng'): string {
    if (!order) {
      return fallback;
    }
    return order.customer_name
      || this.customers.find((customer) => customer.id === order.customer_id)?.name
      || fallback;
  }

  onSalesOrderSearchChange(): void {
    if (this.selectedOrder && this.salesOrderSearchKeyword !== this.selectedOrder.so_number) {
      this.onOrderSelect('');
    }
  }

  selectSalesOrder(order: SalesOrderResponse): void {
    this.salesOrderSearchKeyword = order.so_number;
    this.salesOrderSearchFocused = false;
    this.onOrderSelect(order.id);
  }

  clearSalesOrderSelection(): void {
    this.salesOrderSearchKeyword = '';
    this.salesOrderSearchFocused = true;
    this.onOrderSelect('');
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.sales-order-combobox')) {
      this.salesOrderSearchFocused = false;
    }
  }

  getShipmentNumber(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.shipment_number || 'N/A';
  }

  getSalesOrderId(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.sales_order_id || '';
  }

  getWarehouseId(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.warehouse_id || '';
  }

  getShipmentDate(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.shipment_date || '';
  }

  getShipmentTime(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.shipment_time || '';
  }

  getSelectedOrderQuantity(type: 'ordered' | 'shipped' | 'remaining'): number {
    return (this.selectedOrder?.lines || []).reduce((total, line) => {
      const ordered = Number(line.quantity_ordered) || 0;
      const shipped = Number(line.quantity_shipped) || 0;

      if (type === 'ordered') {
        return total + ordered;
      }
      if (type === 'shipped') {
        return total + shipped;
      }
      return total + Math.max(ordered - shipped, 0);
    }, 0);
  }

  getTrackingNumber(shipment: OutboundShipmentsResponse | null | undefined): string | null {
    return shipment?.tracking_number || null;
  }

  private getDefaultShipmentTime(): string {
    return new Date().toTimeString().slice(0, 5);
  }

  private normalizeSearchText(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  }

  getShipmentStatus(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.status || '';
  }

  getLineProductName(line: OutboundShipmentLinesResponse): string {
    if (line.product_name) return line.product_name;

    const productId = line.product_id;
    if (productId) {
      const product = this.products.find(p => p.id === productId);
      if (product) return product.name;
    }

    return 'Không rõ sản phẩm';
  }

  getLineBatchNumber(line: OutboundShipmentLinesResponse): string | null {
    return line.batch_number || null;
  }

  getLineLocationName(line: OutboundShipmentLinesResponse): string {
    if (line.location_name) return line.location_name;

    return 'Thông tin kho chưa cập nhật';
  }

  getLineQuantity(line: OutboundShipmentLinesResponse): number {
    return Number(line.quantity_shipped ?? 0);
  }

  getLinePickedAt(line: OutboundShipmentLinesResponse): string | null {
    return line.picked_at || null;
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
    return line.picked_by || null;
  }

  getCreatedBy(shipment: OutboundShipmentsResponse | null | undefined): string {
    return shipment?.created_by_name || shipment?.created_by || 'System';
  }

  getCreatedAt(shipment: OutboundShipmentsResponse | null | undefined): string | null {
    return shipment?.created_at || null;
  }

  getUpdatedBy(shipment: OutboundShipmentsResponse | null | undefined): string | null {
    return shipment?.updated_by_name || shipment?.updated_by || null;
  }

  getUpdatedAt(shipment: OutboundShipmentsResponse | null | undefined): string | null {
    return shipment?.updated_at || null;
  }

  getConfirmedBy(shipment: OutboundShipmentsResponse | null | undefined): string | null {
    return shipment?.confirmed_by_name || shipment?.confirmed_by || null;
  }

  getShippedAt(shipment: OutboundShipmentsResponse | null | undefined): string | null {
    return shipment?.shipped_at || null;
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
