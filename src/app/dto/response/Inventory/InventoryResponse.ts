export interface InventoryResponse {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  location_id: string;
  location_code: string;
  location_name: string;
  warehouse_id: string;
  warehouse_name: string;
  batch_id: string | null;
  batch_number: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  uom_code: string;
  last_counted_at: string;
  created_at: string;
  updated_at: string;
}
