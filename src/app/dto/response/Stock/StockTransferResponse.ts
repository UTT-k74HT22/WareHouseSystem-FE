export interface StockTransferResponse {
  id: string;
  transfer_number: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  from_location_id: string;
  from_location_code: string;
  from_location_name: string;
  to_location_id: string;
  to_location_code: string;
  to_location_name: string;
  batch_id: string | null;
  batch_number: string | null;
  quantity: number;
  uom_code: string;
  status: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
