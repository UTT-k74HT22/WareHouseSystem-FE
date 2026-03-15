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
