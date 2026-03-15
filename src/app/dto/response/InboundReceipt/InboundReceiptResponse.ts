import { InboundReceiptStatus } from '../../../helper/enums/InboundReceiptStatus';
import { QualityStatus } from '../../../helper/enums/QualityStatus';

export interface InboundReceiptLineResponse {
  id: string;
  inbound_receipt_id: string;
  purchase_order_line_id: string;
  product_id: string;
  product_sku: string | null;
  product_name: string | null;
  batch_id: string | null;
  batch_number: string | null;
  location_id: string;
  location_code: string | null;
  location_name: string | null;
  line_number: number;
  quantity_received: number;
  quality_status: QualityStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InboundReceiptResponse {
  id: string;
  receipt_number: string;
  purchase_order_id: string;
  purchase_order_number: string | null;
  warehouse_id: string;
  warehouse_name: string | null;
  status: InboundReceiptStatus;
  receipt_date: string;
  delivery_note_number: string | null;
  notes: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  lines: InboundReceiptLineResponse[];
  created_at: string;
  updated_at: string;
}
