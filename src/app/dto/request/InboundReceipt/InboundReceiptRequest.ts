import { InboundReceiptStatus } from '../../../helper/enums/InboundReceiptStatus';

export interface CreateInboundReceiptRequest {
  purchase_order_id?: string;
  supplier_id: string;
  warehouse_id: string;
  expected_date?: string;
  notes?: string;
}

export interface UpdateInboundReceiptRequest {
  status?: InboundReceiptStatus;
  received_date?: string;
  notes?: string;
}
