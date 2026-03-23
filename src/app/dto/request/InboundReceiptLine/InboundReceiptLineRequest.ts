import { QualityStatus } from '../../../helper/enums/QualityStatus';

export interface CreateInboundReceiptLineRequest {
  inbound_receipt_id: string;
  purchase_order_line_id: string;
  location_id: string;
  batch_id?: string;
  quantity_received: number | null;
  quality_status?: QualityStatus;
  notes?: string;
}

export interface UpdateInboundReceiptLineRequest {
  location_id: string;
  batch_id?: string;
  quantity_received: number | null;
  quality_status?: QualityStatus;
  notes?: string;
}
