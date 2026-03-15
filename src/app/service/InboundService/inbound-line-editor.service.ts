import { Injectable } from '@angular/core';
import {
  CreateInboundReceiptLineRequest,
  UpdateInboundReceiptLineRequest
} from '../../dto/request/InboundReceiptLine/InboundReceiptLineRequest';
import { BatchResponse } from '../../dto/response/Batch/BatchResponse';
import { InboundReceiptLineResponse } from '../../dto/response/InboundReceiptLine/InboundReceiptLineResponse';
import { InboundReceiptResponse } from '../../dto/response/InboundReceipt/InboundReceiptResponse';
import { LocationResponse } from '../../dto/response/Location/LocationResponse';
import { ProductResponse } from '../../dto/response/Product/ProductResponse';
import { PurchaseOrderLineResponse } from '../../dto/response/PurchaseOrderLine/PurchaseOrderLineResponse';
import { BatchStatus } from '../../helper/enums/BatchStatus';
import { InboundReceiptStatus } from '../../helper/enums/InboundReceiptStatus';
import { LocationStatus } from '../../helper/enums/LocationStatus';
import { QualityStatus } from '../../helper/enums/QualityStatus';

export type InboundLineEditorMode = 'create' | 'edit';

export interface InboundReceiptLineFormState {
  inbound_receipt_id: string;
  purchase_order_line_id: string;
  location_id: string;
  batch_id: string;
  quantity_received: number | null;
  quality_status: QualityStatus;
  notes: string;
}

export interface InboundLineEditorContext {
  selectedReceipt: InboundReceiptResponse | null;
  selectedLine: InboundReceiptLineResponse | null;
  detailPurchaseOrderLines: PurchaseOrderLineResponse[];
  products: ProductResponse[];
  receiptLocations: LocationResponse[];
  batchCatalog: BatchResponse[];
  lineForm: InboundReceiptLineFormState;
  lineEditorMode: InboundLineEditorMode;
  loadingLineReferences: boolean;
  loadingDetailPurchaseOrder: boolean;
  loadingProductCatalog: boolean;
}

export function createInboundReceiptLineForm(
  receiptId = '',
  purchaseOrderLineId = ''
): InboundReceiptLineFormState {
  return {
    inbound_receipt_id: receiptId,
    purchase_order_line_id: purchaseOrderLineId,
    location_id: '',
    batch_id: '',
    quantity_received: null,
    quality_status: QualityStatus.PASS,
    notes: ''
  };
}

export function createInboundReceiptLineFormFromLine(
  line: InboundReceiptLineResponse
): InboundReceiptLineFormState {
  return {
    inbound_receipt_id: line.inbound_receipt_id,
    purchase_order_line_id: line.purchase_order_line_id,
    location_id: line.location_id,
    batch_id: line.batch_id || '',
    quantity_received: Number(line.quantity_received),
    quality_status: line.quality_status || QualityStatus.PASS,
    notes: line.notes || ''
  };
}

@Injectable({ providedIn: 'root' })
export class InboundLineEditorService {
  isBusy(context: InboundLineEditorContext): boolean {
    return context.loadingLineReferences || context.loadingDetailPurchaseOrder || context.loadingProductCatalog;
  }

  getPurchaseOrderLine(
    context: InboundLineEditorContext,
    lineId: string
  ): PurchaseOrderLineResponse | undefined {
    return context.detailPurchaseOrderLines.find((line) => line.id === lineId);
  }

  getReceiptLineRemaining(
    context: InboundLineEditorContext,
    line: InboundReceiptLineResponse
  ): number | null {
    const purchaseOrderLine = this.getPurchaseOrderLine(context, line.purchase_order_line_id);
    if (!purchaseOrderLine) {
      return null;
    }

    return Math.max(0, Number(purchaseOrderLine.quantity_ordered) - Number(purchaseOrderLine.quantity_received));
  }

  getRemainingAfterThisReceipt(
    context: InboundLineEditorContext,
    line: InboundReceiptLineResponse
  ): number | null {
    const purchaseOrderLine = this.getPurchaseOrderLine(context, line.purchase_order_line_id);
    if (!purchaseOrderLine) {
      return null;
    }

    return Number(purchaseOrderLine.quantity_ordered)
      - Number(purchaseOrderLine.quantity_received)
      - Number(line.quantity_received);
  }

  getSelectedPurchaseOrderLine(context: InboundLineEditorContext): PurchaseOrderLineResponse | undefined {
    return this.getPurchaseOrderLine(context, context.lineForm.purchase_order_line_id);
  }

  getSelectedProduct(context: InboundLineEditorContext): ProductResponse | undefined {
    const purchaseOrderLine = this.getSelectedPurchaseOrderLine(context);
    if (!purchaseOrderLine) {
      return undefined;
    }

    return context.products.find((product) => product.id === purchaseOrderLine.product_id);
  }

  requiresBatchTracking(context: InboundLineEditorContext): boolean {
    return Boolean(this.getSelectedProduct(context)?.requires_batch_tracking);
  }

  getSelectablePurchaseOrderLines(context: InboundLineEditorContext): PurchaseOrderLineResponse[] {
    if (context.lineEditorMode === 'edit' && context.selectedLine) {
      const currentLine = this.getPurchaseOrderLine(context, context.selectedLine.purchase_order_line_id);
      return currentLine ? [currentLine] : [];
    }

    return this.getCreateAvailablePurchaseOrderLines(context);
  }

  getLineOptionLabel(
    context: InboundLineEditorContext,
    line: PurchaseOrderLineResponse
  ): string {
    const productLabel = line.product_sku && line.product_name
      ? `${line.product_sku} - ${line.product_name}`
      : (line.product_name || line.product_id);
    const remaining = this.getRemainingCapacityForPurchaseOrderLine(context, line.id);

    return `Line ${line.line_number} - ${productLabel} - Còn có thể nhận ${remaining.toFixed(2)}`;
  }

  getAvailableLineLocations(context: InboundLineEditorContext): LocationResponse[] {
    return context.receiptLocations
      .filter((location) => location.status !== LocationStatus.INACTIVE && location.status !== LocationStatus.MAINTENANCE)
      .sort((left, right) => `${left.code} ${left.name}`.localeCompare(`${right.code} ${right.name}`));
  }

  getAvailableLineBatches(context: InboundLineEditorContext): BatchResponse[] {
    const product = this.getSelectedProduct(context);
    if (!product || !product.requires_batch_tracking) {
      return [];
    }

    let compatibleBatches = context.batchCatalog.filter((batch) =>
      batch.product_id === product.id
      && batch.status !== BatchStatus.EXPIRED
      && batch.status !== BatchStatus.RECALLED
    );

    if (context.lineForm.quality_status === QualityStatus.PASS) {
      compatibleBatches = compatibleBatches.filter((batch) => batch.status === BatchStatus.AVAILABLE);
    } else {
      compatibleBatches = compatibleBatches.filter((batch) =>
        batch.status === BatchStatus.AVAILABLE || batch.status === BatchStatus.QUARANTINE
      );
    }

    if (context.lineForm.batch_id) {
      const currentBatch = context.batchCatalog.find((batch) => batch.id === context.lineForm.batch_id);
      if (currentBatch && !compatibleBatches.some((batch) => batch.id === currentBatch.id)) {
        compatibleBatches = [currentBatch, ...compatibleBatches];
      }
    }

    return compatibleBatches.sort((left, right) => left.batch_number.localeCompare(right.batch_number));
  }

  getCurrentLineRemainingCapacity(context: InboundLineEditorContext): number | null {
    if (!context.lineForm.purchase_order_line_id) {
      return null;
    }

    return this.getRemainingCapacityForPurchaseOrderLine(
      context,
      context.lineForm.purchase_order_line_id,
      context.lineEditorMode === 'edit' ? context.selectedLine?.id : undefined
    );
  }

  getCurrentLineDraftAllocated(context: InboundLineEditorContext): number | null {
    if (!context.lineForm.purchase_order_line_id) {
      return null;
    }

    return this.getDraftAllocatedForPurchaseOrderLine(
      context,
      context.lineForm.purchase_order_line_id,
      context.lineEditorMode === 'edit' ? context.selectedLine?.id : undefined
    );
  }

  getCreateAvailablePurchaseOrderLines(context: InboundLineEditorContext): PurchaseOrderLineResponse[] {
    return context.detailPurchaseOrderLines
      .filter((line) => this.getRemainingCapacityForPurchaseOrderLine(context, line.id) > 0)
      .sort((left, right) => left.line_number - right.line_number);
  }

  syncFormForCurrentSelection(context: InboundLineEditorContext): InboundReceiptLineFormState {
    const selectedLine = this.getSelectedPurchaseOrderLine(context);
    if (!selectedLine) {
      return { ...context.lineForm };
    }

    const nextForm = { ...context.lineForm };
    const availableLocations = this.getAvailableLineLocations(context);

    if (nextForm.location_id && !availableLocations.some((location) => location.id === nextForm.location_id)) {
      nextForm.location_id = '';
    }

    if (!this.requiresBatchTracking(context)) {
      nextForm.batch_id = '';
      return nextForm;
    }

    const availableBatches = this.getAvailableLineBatches(context);
    if (nextForm.batch_id && !availableBatches.some((batch) => batch.id === nextForm.batch_id)) {
      nextForm.batch_id = '';
    }

    return nextForm;
  }

  buildCreateRequest(form: InboundReceiptLineFormState): CreateInboundReceiptLineRequest {
    return {
      inbound_receipt_id: form.inbound_receipt_id,
      purchase_order_line_id: form.purchase_order_line_id,
      location_id: form.location_id,
      batch_id: this.normalizeOptionalId(form.batch_id) || undefined,
      quantity_received: form.quantity_received,
      quality_status: form.quality_status,
      notes: this.normalizeOptionalText(form.notes) || undefined
    };
  }

  buildUpdateRequest(form: InboundReceiptLineFormState): UpdateInboundReceiptLineRequest {
    return {
      location_id: form.location_id,
      batch_id: this.normalizeOptionalId(form.batch_id) || undefined,
      quantity_received: form.quantity_received,
      quality_status: form.quality_status,
      notes: this.normalizeOptionalText(form.notes) || undefined
    };
  }

  validateForm(context: InboundLineEditorContext): string | null {
    if (!context.selectedReceipt || context.selectedReceipt.status !== InboundReceiptStatus.DRAFT) {
      return 'Phiếu nhập không còn ở trạng thái cho phép sửa dòng.';
    }

    if (this.isBusy(context)) {
      return 'Dữ liệu tham chiếu của dòng phiếu nhập vẫn đang tải. Vui lòng thử lại sau.';
    }

    const purchaseOrderLine = this.getSelectedPurchaseOrderLine(context);
    if (!purchaseOrderLine) {
      return 'Vui lòng chọn dòng đơn mua hàng.';
    }

    const product = this.getSelectedProduct(context);
    if (!product) {
      return 'Không xác định được sản phẩm của dòng đơn mua hàng.';
    }

    const location = this.getAvailableLineLocations(context).find((item) => item.id === context.lineForm.location_id);
    if (!location) {
      return 'Vui lòng chọn vị trí hợp lệ trong kho nhận.';
    }

    const quantityReceived = Number(context.lineForm.quantity_received);
    if (!Number.isFinite(quantityReceived) || quantityReceived <= 0) {
      return 'Số lượng nhận phải lớn hơn 0.';
    }

    const remaining = this.getCurrentLineRemainingCapacity(context);
    if (remaining === null) {
      return 'Không xác định được số lượng còn có thể nhận.';
    }

    if (quantityReceived > remaining) {
      return `Số lượng nhận vượt phần còn lại có thể phân bổ của dòng đơn mua hàng (${remaining.toFixed(2)}).`;
    }

    const notes = this.normalizeOptionalText(context.lineForm.notes);
    if ((notes || '').length > 500) {
      return 'Ghi chú dòng phiếu nhập không được vượt quá 500 ký tự.';
    }

    if (context.lineForm.quality_status === QualityStatus.QUARANTINE && !notes) {
      return 'Dòng nhận hàng bị cách ly bắt buộc phải có ghi chú.';
    }

    const normalizedBatchId = this.normalizeOptionalId(context.lineForm.batch_id);
    if (product.requires_batch_tracking) {
      if (!normalizedBatchId) {
        return 'Sản phẩm này bắt buộc phải chọn lô.';
      }

      const compatibleBatch = this.getAvailableLineBatches(context).find((batch) => batch.id === normalizedBatchId);
      if (!compatibleBatch) {
        return 'Lô đã chọn không còn phù hợp với sản phẩm hoặc trạng thái chất lượng hiện tại.';
      }
    } else if (normalizedBatchId) {
      return 'Sản phẩm này không theo dõi lô, vui lòng bỏ chọn batch.';
    }

    if (this.hasDuplicateSplitDimension(
      context,
      context.lineForm.purchase_order_line_id,
      context.lineForm.location_id,
      normalizedBatchId,
      context.lineForm.quality_status,
      context.lineEditorMode === 'edit' ? context.selectedLine?.id : undefined
    )) {
      return 'Đã tồn tại một dòng khác cùng tổ hợp vị trí, batch và trạng thái chất lượng. Hãy sửa dòng hiện có thay vì tạo trùng.';
    }

    return null;
  }

  private getDraftAllocatedForPurchaseOrderLine(
    context: InboundLineEditorContext,
    purchaseOrderLineId: string,
    excludeLineId?: string
  ): number {
    if (!context.selectedReceipt) {
      return 0;
    }

    return context.selectedReceipt.lines
      .filter((line) => line.purchase_order_line_id === purchaseOrderLineId && line.id !== excludeLineId)
      .reduce((sum, line) => sum + Number(line.quantity_received || 0), 0);
  }

  private getRemainingCapacityForPurchaseOrderLine(
    context: InboundLineEditorContext,
    purchaseOrderLineId: string,
    excludeLineId?: string
  ): number {
    const purchaseOrderLine = this.getPurchaseOrderLine(context, purchaseOrderLineId);
    if (!purchaseOrderLine) {
      return 0;
    }

    const ordered = Number(purchaseOrderLine.quantity_ordered || 0);
    const alreadyReceived = Number(purchaseOrderLine.quantity_received || 0);
    const allocatedOnCurrentReceipt = this.getDraftAllocatedForPurchaseOrderLine(
      context,
      purchaseOrderLineId,
      excludeLineId
    );

    return Math.max(0, ordered - alreadyReceived - allocatedOnCurrentReceipt);
  }

  private hasDuplicateSplitDimension(
    context: InboundLineEditorContext,
    purchaseOrderLineId: string,
    locationId: string,
    batchId: string | null,
    qualityStatus: QualityStatus,
    excludeLineId?: string
  ): boolean {
    if (!context.selectedReceipt) {
      return false;
    }

    return context.selectedReceipt.lines.some((line) =>
      line.id !== excludeLineId
      && line.purchase_order_line_id === purchaseOrderLineId
      && line.location_id === locationId
      && this.normalizeOptionalId(line.batch_id) === batchId
      && line.quality_status === qualityStatus
    );
  }

  private normalizeOptionalText(value?: string | null): string | null {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private normalizeOptionalId(value?: string | null): string | null {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }
}
