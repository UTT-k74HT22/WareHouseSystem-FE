export interface InventorySummaryResponse {
  product_id: string;
  product_sku: string | null;
  product_name: string | null;
  total_on_hand_quantity: number;
  total_quarantine_quantity?: number;
  total_reserved_quantity: number;
  total_available_quantity: number;
  warehouse_count: number;
  location_count: number;
}
