import { InboundReceiptStatus } from '../../../helper/enums/InboundReceiptStatus';
import { InboundReceiptLineResponse } from '../InboundReceiptLine/InboundReceiptLineResponse';

export type { InboundReceiptLineResponse } from '../InboundReceiptLine/InboundReceiptLineResponse';

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
