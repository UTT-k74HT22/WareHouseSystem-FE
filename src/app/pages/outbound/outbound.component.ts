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
      return status === OutboundShipmentStatus.PICKING || status === OutboundShipmentStatus.PACKED;
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
    return this.fb.group({
      sales_order_line_id: [soLine.id, Validators.required],
      product_id: [soLine.product_id, Validators.required],
      product_name: [soLine.product_name || this.getSalesOrderLineProductDisplay(soLine)],
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

    forkJoin({
      shipment: this.outboundService.getById(shipment.id),
      lines: this.oblService.getByShipmentId(shipment.id)
    }).subscribe({
      next: ({ shipment: shipmentRes, lines: linesRes }) => {
        if (shipmentRes.success) {
          this.selectedShipment = {
            ...shipmentRes.data,
            lines: shipmentRes.data.lines || (linesRes.success ? linesRes.data : [])
          };
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
    this.outboundService.startPicking(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã bắt đầu lấy hàng.');
          this.syncSelectedShipment(res.data, true);
          this.loadShipments();
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Không thể bắt đầu lấy hàng.');
      }
    });
  }

  markAsPacked(id: string): void {
    this.outboundService.markAsPacked(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã hoàn tất đóng gói.');
          this.syncSelectedShipment(res.data, true);
          this.loadShipments();
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Không thể chuyển sang trạng thái đã đóng gói.');
      }
    });
  }

  ship(id: string): void {
    this.outboundService.ship(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xác nhận xuất kho thành công.');
          this.syncSelectedShipment(res.data, true);
          this.loadShipments();
          this.loadConfirmedOrders();
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Xuất kho thất bại.');
      }
    });
  }

  cancelShipment(id: string): void {
    this.outboundService.cancel(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Hủy phiếu xuất thành công.');
          this.syncSelectedShipment(res.data, true);
          this.loadShipments();
          this.loadConfirmedOrders();
        }
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Hủy phiếu xuất thất bại.');
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
    return line.product_name || line.productName || 'Không rõ sản phẩm';
  }

  getLineBatchNumber(line: OutboundShipmentLinesResponse): string | null {
    return line.batch_number || line.batchNumber || null;
  }

  getLineLocationName(line: OutboundShipmentLinesResponse): string {
    return line.location_name || line.locationName || 'Chưa được gán bởi workflow';
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

  getShipmentFlowLocationText(): string {
    if (!this.selectedShipment) {
      return '';
    }

    const status = this.getShipmentStatus(this.selectedShipment);
    if (status === OutboundShipmentStatus.DRAFT) {
      return 'Vị trí và lô thực tế sẽ được backend gán khi bắt đầu lấy hàng.';
    }
    if (status === OutboundShipmentStatus.PICKING) {
      return 'Các dòng đã được chuyển sang khu PICKING.';
    }
    if (status === OutboundShipmentStatus.PACKED) {
      return 'Các dòng đã được chuyển sang khu PACKING.';
    }
    if (status === OutboundShipmentStatus.SHIPPED) {
      return 'Các dòng đã đi qua STAGING trước khi xuất kho.';
    }
    return '';
  }
}
