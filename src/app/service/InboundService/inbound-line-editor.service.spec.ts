import { TestBed } from '@angular/core/testing';
import { BatchResponse } from '../../dto/response/Batch/BatchResponse';
import { InboundReceiptLineResponse } from '../../dto/response/InboundReceiptLine/InboundReceiptLineResponse';
import { InboundReceiptResponse } from '../../dto/response/InboundReceipt/InboundReceiptResponse';
import { LocationResponse } from '../../dto/response/Location/LocationResponse';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { PurchaseOrderLineResponse } from '../../dto/response/PurchaseOrderLine/PurchaseOrderLineResponse';
import { BatchStatus } from '../../helper/enums/BatchStatus';
import { InboundReceiptStatus } from '../../helper/enums/InboundReceiptStatus';
import { LocationStatus } from '../../helper/enums/LocationStatus';
import { LocationType } from '../../helper/enums/LocationType';
import { ProductStatus } from '../../helper/enums/ProductStatus';
import { QualityStatus } from '../../helper/enums/QualityStatus';
import {
  createInboundReceiptLineForm,
  InboundLineEditorContext,
  InboundLineEditorService
} from './inbound-line-editor.service';

describe('InboundLineEditorService', () => {
  let service: InboundLineEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InboundLineEditorService);
  });

  it('should normalize optional batch and notes when building create request', () => {
    const form = createInboundReceiptLineForm('receipt-1', 'po-line-1');
    form.location_id = 'loc-1';
    form.quantity_received = 2;
    form.batch_id = '   ';
    form.notes = '  keep me  ';

    expect(service.buildCreateRequest(form)).toEqual({
      inbound_receipt_id: 'receipt-1',
      purchase_order_line_id: 'po-line-1',
      location_id: 'loc-1',
      batch_id: undefined,
      quantity_received: 2,
      quality_status: QualityStatus.PASS,
      notes: 'keep me'
    });
  });

  it('should only expose purchase order lines with remaining capacity', () => {
    const context = createContext({
      detailPurchaseOrderLines: [
        createPurchaseOrderLine('po-line-1', 10, 5, 'prod-1', 1),
        createPurchaseOrderLine('po-line-2', 8, 3, 'prod-2', 2)
      ],
      selectedReceipt: createReceipt([
        createReceiptLine('receipt-line-1', 'po-line-1', 5, 'loc-1', null, QualityStatus.PASS)
      ])
    });

    const selectableLines = service.getCreateAvailablePurchaseOrderLines(context);

    expect(selectableLines.map((line) => line.id)).toEqual(['po-line-2']);
  });

  it('should require a batch for tracked products', () => {
    const context = createContext({
      products: [createProduct('prod-1', true)],
      lineForm: {
        ...createInboundReceiptLineForm('receipt-1', 'po-line-1'),
        location_id: 'loc-1',
        quantity_received: 2,
        batch_id: ''
      }
    });

    expect(service.validateForm(context)).toBe('Sản phẩm này bắt buộc phải chọn lô.');
  });

  it('should reject duplicate split dimensions on the same receipt', () => {
    const context = createContext({
      selectedReceipt: createReceipt([
        createReceiptLine('receipt-line-1', 'po-line-1', 1, 'loc-1', 'batch-1', QualityStatus.PASS)
      ]),
      lineForm: {
        ...createInboundReceiptLineForm('receipt-1', 'po-line-1'),
        location_id: 'loc-1',
        quantity_received: 1,
        batch_id: 'batch-1'
      }
    });

    expect(service.validateForm(context)).toBe(
      'Đã tồn tại một dòng khác cùng tổ hợp vị trí, batch và trạng thái chất lượng. Hãy sửa dòng hiện có thay vì tạo trùng.'
    );
  });

  it('should clear batch selection when the product does not require batch tracking', () => {
    const context = createContext({
      products: [createProduct('prod-1', false)],
      lineForm: {
        ...createInboundReceiptLineForm('receipt-1', 'po-line-1'),
        location_id: 'loc-1',
        quantity_received: 2,
        batch_id: 'batch-1'
      }
    });

    const syncedForm = service.syncFormForCurrentSelection(context);

    expect(syncedForm.batch_id).toBe('');
  });
});

function createContext(overrides: Partial<InboundLineEditorContext> = {}): InboundLineEditorContext {
  return {
    selectedReceipt: createReceipt(),
    selectedLine: null,
    detailPurchaseOrderLines: [createPurchaseOrderLine('po-line-1', 10, 2, 'prod-1', 1)],
    products: [createProduct('prod-1', true)],
    receiptLocations: [createLocation('loc-1')],
    batchCatalog: [createBatch('batch-1', 'prod-1', BatchStatus.AVAILABLE)],
    lineForm: {
      ...createInboundReceiptLineForm('receipt-1', 'po-line-1'),
      location_id: 'loc-1',
      quantity_received: 2,
      batch_id: 'batch-1'
    },
    lineEditorMode: 'create',
    loadingLineReferences: false,
    loadingDetailPurchaseOrder: false,
    loadingProductCatalog: false,
    ...overrides
  };
}

function createReceipt(lines: InboundReceiptLineResponse[] = []): InboundReceiptResponse {
  return {
    id: 'receipt-1',
    receipt_number: 'IR-001',
    purchase_order_id: 'po-1',
    purchase_order_number: 'PO-001',
    warehouse_id: 'wh-1',
    warehouse_name: 'Main Warehouse',
    status: InboundReceiptStatus.DRAFT,
    receipt_date: '2026-03-15',
    delivery_note_number: null,
    notes: null,
    confirmed_at: null,
    confirmed_by: null,
    lines,
    created_at: '2026-03-15T00:00:00Z',
    updated_at: '2026-03-15T00:00:00Z'
  };
}

function createReceiptLine(
  id: string,
  purchaseOrderLineId: string,
  quantityReceived: number,
  locationId: string,
  batchId: string | null,
  qualityStatus: QualityStatus
): InboundReceiptLineResponse {
  return {
    id,
    inbound_receipt_id: 'receipt-1',
    purchase_order_line_id: purchaseOrderLineId,
    product_id: purchaseOrderLineId === 'po-line-2' ? 'prod-2' : 'prod-1',
    product_sku: 'SKU-1',
    product_name: 'Product 1',
    batch_id: batchId,
    batch_number: batchId ? 'BATCH-1' : null,
    location_id: locationId,
    location_code: 'LOC-1',
    location_name: 'Storage A1',
    line_number: 1,
    quantity_received: quantityReceived,
    quality_status: qualityStatus,
    notes: null,
    created_at: '2026-03-15T00:00:00Z',
    updated_at: '2026-03-15T00:00:00Z'
  };
}

function createPurchaseOrderLine(
  id: string,
  quantityOrdered: number,
  quantityReceived: number,
  productId: string,
  lineNumber: number
): PurchaseOrderLineResponse {
  return {
    id,
    purchase_order_id: 'po-1',
    product_id: productId,
    line_number: lineNumber,
    quantity_ordered: quantityOrdered,
    quantity_received: quantityReceived,
    unit_price: 100,
    line_total: quantityOrdered * 100,
    notes: null,
    created_at: '2026-03-15T00:00:00Z',
    updated_at: '2026-03-15T00:00:00Z',
    product_name: `Product ${lineNumber}`,
    product_sku: `SKU-${lineNumber}`
  };
}

function createProduct(id: string, requiresBatchTracking: boolean): ProductResponse {
  return {
    id,
    sku: `${id.toUpperCase()}-SKU`,
    name: `Product ${id}`,
    description: '',
    category_id: 'cat-1',
    category_name: 'Category 1',
    uom_id: 'uom-1',
    uom_name: 'Each',
    uom_code: 'EA',
    weight: null,
    dimensions: null,
    min_stock_level: null,
    max_stock_level: null,
    reorder_point: null,
    cost_price: null,
    selling_price: null,
    barcode: null,
    requires_batch_tracking: requiresBatchTracking,
    status: ProductStatus.ACTIVE,
    image_url: null,
    created_by: null,
    created_at: '2026-03-15T00:00:00Z',
    updated_by: null,
    updated_at: '2026-03-15T00:00:00Z'
  };
}

function createLocation(id: string): LocationResponse {
  return {
    id,
    warehouse_id: 'wh-1',
    warehouse_code: 'WH-1',
    warehouse_name: 'Main Warehouse',
    code: 'LOC-1',
    name: 'Storage A1',
    zone: 'A',
    type: LocationType.STORAGE,
    capacity: 100,
    status: LocationStatus.ACTIVE,
    notes: '',
    created_by: 'system',
    created_at: '2026-03-15T00:00:00Z',
    updated_by: 'system',
    updated_at: '2026-03-15T00:00:00Z'
  };
}

function createBatch(id: string, productId: string, status: BatchStatus): BatchResponse {
  return {
    id,
    batch_number: `BATCH-${id}`,
    product_id: productId,
    product_name: `Product ${productId}`,
    product_sku: `${productId.toUpperCase()}-SKU`,
    manufacturing_date: '2026-03-01',
    expiry_date: null,
    supplier_batch_number: null,
    status,
    notes: null,
    created_by: 'system',
    created_at: '2026-03-15T00:00:00Z',
    updated_by: 'system',
    updated_at: '2026-03-15T00:00:00Z'
  };
}
