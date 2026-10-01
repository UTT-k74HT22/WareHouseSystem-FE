export interface InventoryByProductResponse {
  warehouse_id: string;
  warehouse_name: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  total_on_hand_quantity: number;
  total_quarantine_quantity: number;
  total_reserved_quantity: number;
  total_available_quantity: number;
  location_count: number;
}
