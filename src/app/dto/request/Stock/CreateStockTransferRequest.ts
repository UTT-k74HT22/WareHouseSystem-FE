export interface CreateStockTransferRequest {
  product_id: string;
  from_location_id: string;
  to_location_id: string;
  batch_id?: string;
  quantity: number;
  notes?: string;
}
