export interface InventoryResponse {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  warehouse_name: string;
  location_id: string;
  location_code: string;
  location_name?: string;
  batch_id: string | null;
  batch_number: string | null;
  on_hand_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  uom_code?: string;
  last_movement_at: string | null;
  created_at: string;
  updated_at: string;
}
