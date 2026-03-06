/**
 * ═══════════════════════════════════════════════════════════════
 * MOCK DATA - Dữ liệu mẫu cho phát triển Frontend
 * ═══════════════════════════════════════════════════════════════
 *
 * Mục đích: Cung cấp dữ liệu giả lập khi Backend chưa triển khai.
 * Cách dùng: Import mock data vào component, gọi trong error handler
 *            của API call, hoặc set useMock = true để bỏ qua API.
 *
 * Khi BE sẵn sàng: Xoá dòng loadMockData() trong error handler.
 * ═══════════════════════════════════════════════════════════════
 */

import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { CategoryResponse } from '../../dto/response/Category/CategoryResponse';
import { UnitsOfMeasureResponse } from '../../dto/response/UOM/UnitsOfMeasureResponse';
import { BusinessPartnerResponse } from '../../dto/response/BusinessPartner/BusinessPartnerResponse';
import { BatchResponse } from '../../dto/response/Batch/BatchResponse';
import { PurchaseOrderResponse } from '../../dto/response/PurchaseOrder/PurchaseOrderResponse';
import { SalesOrderResponse } from '../../dto/response/SalesOrder/SalesOrderResponse';
import { InboundReceiptResponse } from '../../dto/response/InboundReceipt/InboundReceiptResponse';
import { OutboundShipmentResponse } from '../../dto/response/OutboundShipment/OutboundShipmentResponse';
import { InventoryResponse } from '../../dto/response/Inventory/InventoryResponse';
import { StockMovementResponse } from '../../dto/response/Stock/StockMovementResponse';
import { StockAdjustmentResponse } from '../../dto/response/Stock/StockAdjustmentResponse';
import { StockTransferResponse } from '../../dto/response/Stock/StockTransferResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';

import { ProductStatus } from '../enums/ProductStatus';
import { CategoryStatus } from '../enums/CategoryStatus';
import { BusinessPartnerType } from '../enums/BusinessPartnerType';
import { BusinessPartnerStatus } from '../enums/BusinessPartnerStatus';
import { BatchStatus } from '../enums/BatchStatus';
import { OrderStatus } from '../enums/OrderStatus';
import { InboundReceiptStatus } from '../enums/InboundReceiptStatus';
import { OutboundShipmentStatus } from '../enums/OutboundShipmentStatus';
import { StockMovementType } from '../enums/StockMovementType';
import { ReasonType } from '../enums/ReasonType';
import { StockAdjustmentsStatus } from '../enums/StockAdjustmentsStatus';
import { WareHouseStatus } from '../enums/WareHouseStatus';
import { WareHouseType } from '../enums/WareHouseType';

import { PageResponse } from '../../dto/response/PageResponse';

// ════════════════════════════════════════════════════════════
// HELPER: Tạo PageResponse wrapper
// ════════════════════════════════════════════════════════════
export function mockPage<T>(items: T[], page = 0, size = 10): PageResponse<T> {
  return {
    content: items.slice(page * size, (page + 1) * size),
    page,
    size,
    total_elements: items.length,
    total_pages: Math.ceil(items.length / size),
    is_first: page === 0,
    is_last: (page + 1) * size >= items.length,
  };
}

// ════════════════════════════════════════════════════════════
// WAREHOUSE - Kho hàng
// ════════════════════════════════════════════════════════════
export const MOCK_WAREHOUSES: WareHouseResponse[] = [
  { id: 'wh-001', code: 'WH-MAIN', name: 'Kho chính Hà Nội', address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội', phone: '024-1234-5678', email: 'main@whs.vn', status: WareHouseStatus.ACTIVE, ware_house_type: WareHouseType.MAIN, manager_id: 'user-001' },
  { id: 'wh-002', code: 'WH-HCM', name: 'Kho TP.HCM', address: '456 Lê Văn Việt, Q.9, TP.HCM', phone: '028-8765-4321', email: 'hcm@whs.vn', status: WareHouseStatus.ACTIVE, ware_house_type: WareHouseType.SATELLITE, manager_id: 'user-002' },
  { id: 'wh-003', code: 'WH-DN', name: 'Kho Đà Nẵng', address: '789 Trần Phú, Hải Châu, Đà Nẵng', phone: '023-6543-2100', email: 'dn@whs.vn', status: WareHouseStatus.UNDER_MAINTENANCE, ware_house_type: WareHouseType.SATELLITE, manager_id: 'user-003' },
];

// ════════════════════════════════════════════════════════════
// CATEGORY - Danh mục sản phẩm
// ════════════════════════════════════════════════════════════
export const MOCK_CATEGORIES: CategoryResponse[] = [
  { id: 'cat-001', code: 'CAT-ELEC', name: 'Điện tử', description: 'Thiết bị điện tử, linh kiện', parent_id: null, parent_name: null, status: CategoryStatus.ACTIVE, product_count: 25, created_by: 'admin', created_at: '2025-01-10T08:00:00', updated_by: 'admin', updated_at: '2025-01-10T08:00:00' },
  { id: 'cat-002', code: 'CAT-FOOD', name: 'Thực phẩm', description: 'Thực phẩm đóng gói, đồ khô', parent_id: null, parent_name: null, status: CategoryStatus.ACTIVE, product_count: 40, created_by: 'admin', created_at: '2025-01-10T08:00:00', updated_by: 'admin', updated_at: '2025-01-10T08:00:00' },
  { id: 'cat-003', code: 'CAT-CHEM', name: 'Hoá chất', description: 'Hoá chất công nghiệp', parent_id: null, parent_name: null, status: CategoryStatus.ACTIVE, product_count: 15, created_by: 'admin', created_at: '2025-01-10T08:00:00', updated_by: 'admin', updated_at: '2025-01-10T08:00:00' },
  { id: 'cat-004', code: 'CAT-OFF', name: 'Văn phòng phẩm', description: 'Dụng cụ văn phòng', parent_id: null, parent_name: null, status: CategoryStatus.INACTIVE, product_count: 8, created_by: 'admin', created_at: '2025-02-01T08:00:00', updated_by: 'admin', updated_at: '2025-02-01T08:00:00' },
];

// ════════════════════════════════════════════════════════════
// UOM - Đơn vị tính
// ════════════════════════════════════════════════════════════
export const MOCK_UOMS: UnitsOfMeasureResponse[] = [
  { id: 'uom-001', code: 'PCS', name: 'Cái', description: 'Đơn vị đếm từng cái', created_by: 'admin', created_at: '2025-01-01T00:00:00', updated_by: 'admin', updated_at: '2025-01-01T00:00:00' },
  { id: 'uom-002', code: 'KG', name: 'Kilogram', description: 'Đơn vị khối lượng', created_by: 'admin', created_at: '2025-01-01T00:00:00', updated_by: 'admin', updated_at: '2025-01-01T00:00:00' },
  { id: 'uom-003', code: 'BOX', name: 'Thùng', description: 'Đơn vị đóng thùng', created_by: 'admin', created_at: '2025-01-01T00:00:00', updated_by: 'admin', updated_at: '2025-01-01T00:00:00' },
  { id: 'uom-004', code: 'LIT', name: 'Lít', description: 'Đơn vị thể tích', created_by: 'admin', created_at: '2025-01-01T00:00:00', updated_by: 'admin', updated_at: '2025-01-01T00:00:00' },
  { id: 'uom-005', code: 'SET', name: 'Bộ', description: 'Đơn vị bộ/combo', created_by: 'admin', created_at: '2025-01-01T00:00:00', updated_by: 'admin', updated_at: '2025-01-01T00:00:00' },
];

// ════════════════════════════════════════════════════════════
// PRODUCT - Sản phẩm
// ════════════════════════════════════════════════════════════
export const MOCK_PRODUCTS: ProductResponse[] = [
  { id: 'prod-001', sku: 'SP-LAPTOP-001', name: 'Laptop Dell Inspiron 15', description: 'Laptop văn phòng 15.6 inch', category_id: 'cat-001', category_name: 'Điện tử', uom_id: 'uom-001', uom_name: 'Cái', uom_code: 'PCS', weight: 2.1, length: 36, width: 25, height: 2, min_stock_level: 10, max_stock_level: 200, reorder_point: 20, is_batch_tracked: false, status: ProductStatus.ACTIVE, image_url: '', created_by: 'admin', created_at: '2025-01-15T10:00:00', updated_by: 'admin', updated_at: '2025-02-01T08:00:00' },
  { id: 'prod-002', sku: 'SP-RICE-002', name: 'Gạo ST25 túi 5kg', description: 'Gạo thơm ST25 Sóc Trăng', category_id: 'cat-002', category_name: 'Thực phẩm', uom_id: 'uom-002', uom_name: 'Kilogram', uom_code: 'KG', weight: 5, length: 30, width: 20, height: 10, min_stock_level: 100, max_stock_level: 5000, reorder_point: 500, is_batch_tracked: true, status: ProductStatus.ACTIVE, image_url: '', created_by: 'admin', created_at: '2025-01-15T10:00:00', updated_by: 'admin', updated_at: '2025-01-15T10:00:00' },
  { id: 'prod-003', sku: 'SP-CLEAN-003', name: 'Nước rửa tay Lifebuoy 500ml', description: 'Nước rửa tay diệt khuẩn', category_id: 'cat-003', category_name: 'Hoá chất', uom_id: 'uom-004', uom_name: 'Lít', uom_code: 'LIT', weight: 0.55, length: 8, width: 5, height: 20, min_stock_level: 200, max_stock_level: 10000, reorder_point: 1000, is_batch_tracked: true, status: ProductStatus.ACTIVE, image_url: '', created_by: 'admin', created_at: '2025-01-20T10:00:00', updated_by: 'admin', updated_at: '2025-01-20T10:00:00' },
  { id: 'prod-004', sku: 'SP-PEN-004', name: 'Bút bi Thiên Long TL-027', description: 'Bút bi 0.5mm, mực xanh', category_id: 'cat-004', category_name: 'Văn phòng phẩm', uom_id: 'uom-003', uom_name: 'Thùng', uom_code: 'BOX', weight: 0.01, length: 14, width: 1, height: 1, min_stock_level: 500, max_stock_level: 50000, reorder_point: 5000, is_batch_tracked: false, status: ProductStatus.ACTIVE, image_url: '', created_by: 'admin', created_at: '2025-02-01T10:00:00', updated_by: 'admin', updated_at: '2025-02-01T10:00:00' },
  { id: 'prod-005', sku: 'SP-MOUSE-005', name: 'Chuột Logitech M331', description: 'Chuột không dây silent', category_id: 'cat-001', category_name: 'Điện tử', uom_id: 'uom-001', uom_name: 'Cái', uom_code: 'PCS', weight: 0.09, length: 10, width: 6, height: 4, min_stock_level: 50, max_stock_level: 1000, reorder_point: 100, is_batch_tracked: false, status: ProductStatus.INACTIVE, image_url: '', created_by: 'admin', created_at: '2025-02-10T10:00:00', updated_by: 'admin', updated_at: '2025-02-15T10:00:00' },
];

// ════════════════════════════════════════════════════════════
// BUSINESS PARTNER - Đối tác kinh doanh
// ════════════════════════════════════════════════════════════
export const MOCK_BUSINESS_PARTNERS: BusinessPartnerResponse[] = [
  { id: 'bp-001', code: 'NCC-001', name: 'Công ty TNHH Phú Thái', type: BusinessPartnerType.SUPPLIER, email: 'info@phuthai.vn', phone: '024-3333-4444', address: '100 Láng Hạ, Đống Đa, Hà Nội', tax_code: '0100100200', contact_person: 'Nguyễn Văn An', status: BusinessPartnerStatus.ACTIVE, notes: '', created_by: 'admin', created_at: '2025-01-05T08:00:00', updated_by: 'admin', updated_at: '2025-01-05T08:00:00' },
  { id: 'bp-002', code: 'KH-001', name: 'Siêu thị BigC Thăng Long', type: BusinessPartnerType.CUSTOMER, email: 'order@bigc.vn', phone: '024-5555-6666', address: '222 Trần Duy Hưng, Cầu Giấy, Hà Nội', tax_code: '0100200300', contact_person: 'Trần Thị Bình', status: BusinessPartnerStatus.ACTIVE, notes: '', created_by: 'admin', created_at: '2025-01-06T08:00:00', updated_by: 'admin', updated_at: '2025-01-06T08:00:00' },
  { id: 'bp-003', code: 'NCC-002', name: 'Dell Technologies VN', type: BusinessPartnerType.SUPPLIER, email: 'sales@dell.com.vn', phone: '028-7777-8888', address: '789 Nguyễn Văn Linh, Q.7, TP.HCM', tax_code: '0300400500', contact_person: 'Lê Hoàng Cường', status: BusinessPartnerStatus.ACTIVE, notes: 'Nhà cung cấp laptop và PC', created_by: 'admin', created_at: '2025-01-10T08:00:00', updated_by: 'admin', updated_at: '2025-01-10T08:00:00' },
  { id: 'bp-004', code: 'BP-003', name: 'Công ty CP Thiên Long', type: BusinessPartnerType.BOTH, email: 'contact@thienlong.vn', phone: '028-1111-2222', address: '45 Lý Thường Kiệt, Q.10, TP.HCM', tax_code: '0300100100', contact_person: 'Phạm Minh Đức', status: BusinessPartnerStatus.ACTIVE, notes: 'Vừa là NCC vừa là KH', created_by: 'admin', created_at: '2025-02-01T08:00:00', updated_by: 'admin', updated_at: '2025-02-01T08:00:00' },
];

// ════════════════════════════════════════════════════════════
// BATCH - Lô hàng
// ════════════════════════════════════════════════════════════
export const MOCK_BATCHES: BatchResponse[] = [
  { id: 'bat-001', batch_number: 'LOT-2025-001', product_id: 'prod-002', product_name: 'Gạo ST25 túi 5kg', product_sku: 'SP-RICE-002', manufacture_date: '2025-01-10', expiry_date: '2026-01-10', quantity: 500, status: BatchStatus.ACTIVE, supplier_id: 'bp-001', supplier_name: 'Công ty TNHH Phú Thái', notes: '', created_by: 'admin', created_at: '2025-01-12T10:00:00', updated_by: 'admin', updated_at: '2025-01-12T10:00:00' },
  { id: 'bat-002', batch_number: 'LOT-2025-002', product_id: 'prod-003', product_name: 'Nước rửa tay Lifebuoy 500ml', product_sku: 'SP-CLEAN-003', manufacture_date: '2024-06-15', expiry_date: '2025-06-15', quantity: 200, status: BatchStatus.EXPIRED, supplier_id: 'bp-001', supplier_name: 'Công ty TNHH Phú Thái', notes: 'Lô đã hết hạn', created_by: 'admin', created_at: '2024-07-01T10:00:00', updated_by: 'admin', updated_at: '2025-06-16T10:00:00' },
  { id: 'bat-003', batch_number: 'LOT-2025-003', product_id: 'prod-002', product_name: 'Gạo ST25 túi 5kg', product_sku: 'SP-RICE-002', manufacture_date: '2025-02-01', expiry_date: '2026-02-01', quantity: 1000, status: BatchStatus.ACTIVE, supplier_id: 'bp-001', supplier_name: 'Công ty TNHH Phú Thái', notes: 'Lô mới nhất', created_by: 'admin', created_at: '2025-02-05T10:00:00', updated_by: 'admin', updated_at: '2025-02-05T10:00:00' },
];

// ════════════════════════════════════════════════════════════
// PURCHASE ORDER - Đơn mua hàng
// ════════════════════════════════════════════════════════════
export const MOCK_PURCHASE_ORDERS: PurchaseOrderResponse[] = [
  { id: 'po-001', order_number: 'PO-2025-0001', supplier_id: 'bp-001', supplier_name: 'Công ty TNHH Phú Thái', warehouse_id: 'wh-001', warehouse_name: 'Kho chính Hà Nội', status: OrderStatus.COMPLETED, order_date: '2025-01-20', expected_date: '2025-01-25', total_amount: 150000000, currency: 'VND', notes: '', created_by: 'admin', created_at: '2025-01-20T08:00:00', updated_by: 'admin', updated_at: '2025-01-25T17:00:00' },
  { id: 'po-002', order_number: 'PO-2025-0002', supplier_id: 'bp-003', supplier_name: 'Dell Technologies VN', warehouse_id: 'wh-001', warehouse_name: 'Kho chính Hà Nội', status: OrderStatus.CONFIRMED, order_date: '2025-02-10', expected_date: '2025-02-20', total_amount: 500000000, currency: 'VND', notes: 'Đơn hàng laptop Q1', created_by: 'admin', created_at: '2025-02-10T08:00:00', updated_by: 'admin', updated_at: '2025-02-10T08:00:00' },
  { id: 'po-003', order_number: 'PO-2025-0003', supplier_id: 'bp-004', supplier_name: 'Công ty CP Thiên Long', warehouse_id: 'wh-002', warehouse_name: 'Kho TP.HCM', status: OrderStatus.DRAFT, order_date: '2025-02-25', expected_date: '2025-03-05', total_amount: 25000000, currency: 'VND', notes: '', created_by: 'admin', created_at: '2025-02-25T08:00:00', updated_by: 'admin', updated_at: '2025-02-25T08:00:00' },
];

// ════════════════════════════════════════════════════════════
// SALES ORDER - Đơn bán hàng
// ════════════════════════════════════════════════════════════
export const MOCK_SALES_ORDERS: SalesOrderResponse[] = [
  { id: 'so-001', order_number: 'SO-2025-0001', customer_id: 'bp-002', customer_name: 'Siêu thị BigC Thăng Long', warehouse_id: 'wh-001', warehouse_name: 'Kho chính Hà Nội', status: OrderStatus.COMPLETED, order_date: '2025-01-28', expected_date: '2025-02-02', total_amount: 80000000, currency: 'VND', notes: '', created_by: 'admin', created_at: '2025-01-28T08:00:00', updated_by: 'admin', updated_at: '2025-02-02T17:00:00' },
  { id: 'so-002', order_number: 'SO-2025-0002', customer_id: 'bp-002', customer_name: 'Siêu thị BigC Thăng Long', warehouse_id: 'wh-001', warehouse_name: 'Kho chính Hà Nội', status: OrderStatus.IN_PROGRESS, order_date: '2025-02-20', expected_date: '2025-02-28', total_amount: 120000000, currency: 'VND', notes: 'Đơn bổ sung tháng 2', created_by: 'admin', created_at: '2025-02-20T08:00:00', updated_by: 'admin', updated_at: '2025-02-20T08:00:00' },
  { id: 'so-003', order_number: 'SO-2025-0003', customer_id: 'bp-004', customer_name: 'Công ty CP Thiên Long', warehouse_id: 'wh-002', warehouse_name: 'Kho TP.HCM', status: OrderStatus.DRAFT, order_date: '2025-02-27', expected_date: '2025-03-10', total_amount: 35000000, currency: 'VND', notes: '', created_by: 'admin', created_at: '2025-02-27T08:00:00', updated_by: 'admin', updated_at: '2025-02-27T08:00:00' },
];

// ════════════════════════════════════════════════════════════
// INBOUND RECEIPT - Phiếu nhập kho
// ════════════════════════════════════════════════════════════
export const MOCK_INBOUND_RECEIPTS: InboundReceiptResponse[] = [
  { id: 'inb-001', receipt_number: 'IR-2025-0001', purchase_order_id: 'po-001', purchase_order_number: 'PO-2025-0001', supplier_id: 'bp-001', supplier_name: 'Công ty TNHH Phú Thái', warehouse_id: 'wh-001', warehouse_name: 'Kho chính Hà Nội', status: InboundReceiptStatus.COMPLETED, expected_date: '2025-01-25', received_date: '2025-01-25', notes: 'Nhận đủ hàng', created_by: 'admin', created_at: '2025-01-25T08:00:00', updated_by: 'admin', updated_at: '2025-01-25T17:00:00' },
  { id: 'inb-002', receipt_number: 'IR-2025-0002', purchase_order_id: 'po-002', purchase_order_number: 'PO-2025-0002', supplier_id: 'bp-003', supplier_name: 'Dell Technologies VN', warehouse_id: 'wh-001', warehouse_name: 'Kho chính Hà Nội', status: InboundReceiptStatus.PENDING, expected_date: '2025-02-20', received_date: '', notes: '', created_by: 'admin', created_at: '2025-02-11T08:00:00', updated_by: 'admin', updated_at: '2025-02-11T08:00:00' },
  { id: 'inb-003', receipt_number: 'IR-2025-0003', purchase_order_id: null, purchase_order_number: null, supplier_id: 'bp-001', supplier_name: 'Công ty TNHH Phú Thái', warehouse_id: 'wh-002', warehouse_name: 'Kho TP.HCM', status: InboundReceiptStatus.IN_PROGRESS, expected_date: '2025-02-28', received_date: '', notes: 'Nhập hàng bổ sung', created_by: 'admin', created_at: '2025-02-25T08:00:00', updated_by: 'admin', updated_at: '2025-02-26T10:00:00' },
];

// ════════════════════════════════════════════════════════════
// OUTBOUND SHIPMENT - Phiếu xuất kho
// ════════════════════════════════════════════════════════════
export const MOCK_OUTBOUND_SHIPMENTS: OutboundShipmentResponse[] = [
  { id: 'out-001', shipment_number: 'OS-2025-0001', sales_order_id: 'so-001', sales_order_number: 'SO-2025-0001', customer_id: 'bp-002', customer_name: 'Siêu thị BigC Thăng Long', warehouse_id: 'wh-001', warehouse_name: 'Kho chính Hà Nội', status: OutboundShipmentStatus.DELIVERED, expected_date: '2025-02-02', shipped_date: '2025-02-01', carrier: 'GHN Express', tracking_number: 'GHN123456789', notes: '', created_by: 'admin', created_at: '2025-01-30T08:00:00', updated_by: 'admin', updated_at: '2025-02-02T15:00:00' },
  { id: 'out-002', shipment_number: 'OS-2025-0002', sales_order_id: 'so-002', sales_order_number: 'SO-2025-0002', customer_id: 'bp-002', customer_name: 'Siêu thị BigC Thăng Long', warehouse_id: 'wh-001', warehouse_name: 'Kho chính Hà Nội', status: OutboundShipmentStatus.PICKING, expected_date: '2025-02-28', shipped_date: '', carrier: '', tracking_number: '', notes: 'Đang chuẩn bị hàng', created_by: 'admin', created_at: '2025-02-22T08:00:00', updated_by: 'admin', updated_at: '2025-02-25T10:00:00' },
  { id: 'out-003', shipment_number: 'OS-2025-0003', sales_order_id: null, sales_order_number: null, customer_id: 'bp-004', customer_name: 'Công ty CP Thiên Long', warehouse_id: 'wh-002', warehouse_name: 'Kho TP.HCM', status: OutboundShipmentStatus.PENDING, expected_date: '2025-03-10', shipped_date: '', carrier: '', tracking_number: '', notes: '', created_by: 'admin', created_at: '2025-02-27T08:00:00', updated_by: 'admin', updated_at: '2025-02-27T08:00:00' },
];

// ════════════════════════════════════════════════════════════
// INVENTORY - Tồn kho
// ════════════════════════════════════════════════════════════
export const MOCK_INVENTORIES: InventoryResponse[] = [
  { id: 'inv-001', product_id: 'prod-001', product_name: 'Laptop Dell Inspiron 15', product_sku: 'SP-LAPTOP-001', location_id: 'loc-001', location_code: 'A-01-01', location_name: 'Kệ A, Tầng 1, Ô 1', warehouse_id: 'wh-001', warehouse_name: 'Kho chính Hà Nội', batch_id: null, batch_number: null, quantity_on_hand: 50, quantity_reserved: 5, quantity_available: 45, uom_code: 'PCS', last_counted_at: '2025-02-20T10:00:00', created_at: '2025-01-15T10:00:00', updated_at: '2025-02-20T10:00:00' },
  { id: 'inv-002', product_id: 'prod-002', product_name: 'Gạo ST25 túi 5kg', product_sku: 'SP-RICE-002', location_id: 'loc-002', location_code: 'B-01-01', location_name: 'Kệ B, Tầng 1, Ô 1', warehouse_id: 'wh-001', warehouse_name: 'Kho chính Hà Nội', batch_id: 'bat-001', batch_number: 'LOT-2025-001', quantity_on_hand: 300, quantity_reserved: 50, quantity_available: 250, uom_code: 'KG', last_counted_at: '2025-02-18T10:00:00', created_at: '2025-01-12T10:00:00', updated_at: '2025-02-18T10:00:00' },
  { id: 'inv-003', product_id: 'prod-002', product_name: 'Gạo ST25 túi 5kg', product_sku: 'SP-RICE-002', location_id: 'loc-003', location_code: 'B-02-01', location_name: 'Kệ B, Tầng 2, Ô 1', warehouse_id: 'wh-001', warehouse_name: 'Kho chính Hà Nội', batch_id: 'bat-003', batch_number: 'LOT-2025-003', quantity_on_hand: 800, quantity_reserved: 0, quantity_available: 800, uom_code: 'KG', last_counted_at: '2025-02-20T10:00:00', created_at: '2025-02-05T10:00:00', updated_at: '2025-02-20T10:00:00' },
  { id: 'inv-004', product_id: 'prod-003', product_name: 'Nước rửa tay Lifebuoy 500ml', product_sku: 'SP-CLEAN-003', location_id: 'loc-004', location_code: 'C-01-01', location_name: 'Kệ C, Tầng 1, Ô 1', warehouse_id: 'wh-001', warehouse_name: 'Kho chính Hà Nội', batch_id: 'bat-002', batch_number: 'LOT-2025-002', quantity_on_hand: 5, quantity_reserved: 0, quantity_available: 5, uom_code: 'LIT', last_counted_at: '2025-02-19T10:00:00', created_at: '2024-07-01T10:00:00', updated_at: '2025-02-19T10:00:00' },
  { id: 'inv-005', product_id: 'prod-004', product_name: 'Bút bi Thiên Long TL-027', product_sku: 'SP-PEN-004', location_id: 'loc-005', location_code: 'D-01-01', location_name: 'Kệ D, Tầng 1, Ô 1', warehouse_id: 'wh-002', warehouse_name: 'Kho TP.HCM', batch_id: null, batch_number: null, quantity_on_hand: 2000, quantity_reserved: 100, quantity_available: 1900, uom_code: 'BOX', last_counted_at: '2025-02-15T10:00:00', created_at: '2025-02-01T10:00:00', updated_at: '2025-02-15T10:00:00' },
];

// ════════════════════════════════════════════════════════════
// STOCK MOVEMENT - Lịch sử kho
// ════════════════════════════════════════════════════════════
export const MOCK_STOCK_MOVEMENTS: StockMovementResponse[] = [
  { id: 'sm-001', movement_number: 'SM-2025-0001', type: StockMovementType.INBOUND, product_id: 'prod-002', product_name: 'Gạo ST25 túi 5kg', product_sku: 'SP-RICE-002', from_location_id: null, from_location_code: null, to_location_id: 'loc-002', to_location_code: 'B-01-01', batch_id: 'bat-001', batch_number: 'LOT-2025-001', quantity: 500, uom_code: 'KG', reference_type: 'INBOUND_RECEIPT', reference_id: 'inb-001', notes: '', created_by: 'admin', created_at: '2025-01-25T10:00:00' },
  { id: 'sm-002', movement_number: 'SM-2025-0002', type: StockMovementType.OUTBOUND, product_id: 'prod-002', product_name: 'Gạo ST25 túi 5kg', product_sku: 'SP-RICE-002', from_location_id: 'loc-002', from_location_code: 'B-01-01', to_location_id: null, to_location_code: null, batch_id: 'bat-001', batch_number: 'LOT-2025-001', quantity: 200, uom_code: 'KG', reference_type: 'OUTBOUND_SHIPMENT', reference_id: 'out-001', notes: '', created_by: 'admin', created_at: '2025-02-01T14:00:00' },
  { id: 'sm-003', movement_number: 'SM-2025-0003', type: StockMovementType.TRANSFER, product_id: 'prod-001', product_name: 'Laptop Dell Inspiron 15', product_sku: 'SP-LAPTOP-001', from_location_id: 'loc-006', from_location_code: 'A-02-01', to_location_id: 'loc-001', to_location_code: 'A-01-01', batch_id: null, batch_number: null, quantity: 10, uom_code: 'PCS', reference_type: 'STOCK_TRANSFER', reference_id: 'st-001', notes: 'Chuyển hàng sang kệ chính', created_by: 'admin', created_at: '2025-02-15T09:00:00' },
  { id: 'sm-004', movement_number: 'SM-2025-0004', type: StockMovementType.ADJUSTMENT, product_id: 'prod-003', product_name: 'Nước rửa tay Lifebuoy 500ml', product_sku: 'SP-CLEAN-003', from_location_id: null, from_location_code: null, to_location_id: 'loc-004', to_location_code: 'C-01-01', batch_id: 'bat-002', batch_number: 'LOT-2025-002', quantity: -15, uom_code: 'LIT', reference_type: 'STOCK_ADJUSTMENT', reference_id: 'sa-001', notes: 'Hàng hỏng do vỡ', created_by: 'admin', created_at: '2025-02-20T11:00:00' },
];

// ════════════════════════════════════════════════════════════
// STOCK ADJUSTMENT - Điều chỉnh tồn kho
// ════════════════════════════════════════════════════════════
export const MOCK_STOCK_ADJUSTMENTS: StockAdjustmentResponse[] = [
  {
    id: 'sa-001',
    adjustment_number: 'ADJ-20250220110000-A1B2C3D4',
    inventory_id: 'inv-004',
    product_id: 'prod-003',
    warehouse_id: 'wh-001',
    location_id: 'loc-004',
    batch_id: 'bat-002',
    quantity_before: 20,
    quantity_after: 5,
    adjustment_quantity: -15,
    reason: ReasonType.DAMAGE,
    status: StockAdjustmentsStatus.APPROVED,
    notes: 'Kiểm kê phát hiện 15 chai bị vỡ.',
    requires_approval: false,
    approved_at: '2025-02-20T11:05:00',
    rejection_reason: null,
    created_at: '2025-02-20T11:00:00',
    updated_at: '2025-02-20T11:05:00'
  },
  {
    id: 'sa-002',
    adjustment_number: 'ADJ-20250222090000-E5F6G7H8',
    inventory_id: 'inv-005',
    product_id: 'prod-004',
    warehouse_id: 'wh-002',
    location_id: 'loc-005',
    batch_id: null,
    quantity_before: 2000,
    quantity_after: 1980,
    adjustment_quantity: -20,
    reason: ReasonType.THEFT,
    status: StockAdjustmentsStatus.PENDING_APPROVAL,
    notes: 'Ca trực đêm báo thiếu 20 hộp sau đối chiếu camera.',
    requires_approval: true,
    approved_at: null,
    rejection_reason: null,
    created_at: '2025-02-22T09:00:00',
    updated_at: '2025-02-22T09:00:00'
  },
  {
    id: 'sa-003',
    adjustment_number: 'ADJ-20250223103000-K9L0M1N2',
    inventory_id: 'inv-002',
    product_id: 'prod-002',
    warehouse_id: 'wh-001',
    location_id: 'loc-002',
    batch_id: 'bat-001',
    quantity_before: 300,
    quantity_after: 295,
    adjustment_quantity: -5,
    reason: ReasonType.QUALITY_ISSUE,
    status: StockAdjustmentsStatus.REJECTED,
    notes: 'Đề nghị loại bỏ 5kg do nghi ngờ ẩm mốc.',
    requires_approval: true,
    approved_at: '2025-02-23T11:00:00',
    rejection_reason: 'Chưa có biên bản QC kèm theo.',
    created_at: '2025-02-23T10:30:00',
    updated_at: '2025-02-23T11:00:00'
  },
];

// ════════════════════════════════════════════════════════════
// STOCK TRANSFER - Chuyển kho
// ════════════════════════════════════════════════════════════
export const MOCK_STOCK_TRANSFERS: StockTransferResponse[] = [
  { id: 'st-001', transfer_number: 'ST-2025-0001', product_id: 'prod-001', product_name: 'Laptop Dell Inspiron 15', product_sku: 'SP-LAPTOP-001', from_location_id: 'loc-006', from_location_code: 'A-02-01', from_location_name: 'Kệ A, Tầng 2, Ô 1', to_location_id: 'loc-001', to_location_code: 'A-01-01', to_location_name: 'Kệ A, Tầng 1, Ô 1', batch_id: null, batch_number: null, quantity: 10, uom_code: 'PCS', status: 'COMPLETED', notes: 'Chuyển hàng xuống tầng 1', created_by: 'admin', created_at: '2025-02-15T09:00:00', updated_at: '2025-02-15T09:30:00' },
  { id: 'st-002', transfer_number: 'ST-2025-0002', product_id: 'prod-002', product_name: 'Gạo ST25 túi 5kg', product_sku: 'SP-RICE-002', from_location_id: 'loc-002', from_location_code: 'B-01-01', from_location_name: 'Kệ B, Tầng 1, Ô 1', to_location_id: 'loc-003', to_location_code: 'B-02-01', to_location_name: 'Kệ B, Tầng 2, Ô 1', batch_id: 'bat-003', batch_number: 'LOT-2025-003', quantity: 200, uom_code: 'KG', status: 'PENDING', notes: 'Phân bổ lại kho', created_by: 'admin', created_at: '2025-02-26T14:00:00', updated_at: '2025-02-26T14:00:00' },
];
