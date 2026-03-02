import { InboundReceiptStatus } from '../../../helper/enums/InboundReceiptStatus';

export interface InboundReceiptResponse {
  id: string;
  receipt_number: string;
  purchase_order_id: string | null;
  purchase_order_number: string | null;
  supplier_id: string;
  supplier_name: string;
  warehouse_id: string;
  warehouse_name: string;
  status: InboundReceiptStatus;
  expected_date: string;
  received_date: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}
