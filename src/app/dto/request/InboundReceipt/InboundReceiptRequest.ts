export interface CreateInboundReceiptRequest {
  purchase_order_id: string;
  receipt_date?: string;
  delivery_note_number?: string;
  notes?: string;
}

export interface UpdateInboundReceiptRequest {
  receipt_date?: string;
  delivery_note_number?: string;
  notes?: string;
}
