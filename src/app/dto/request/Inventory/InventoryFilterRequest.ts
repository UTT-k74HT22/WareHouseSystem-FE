export interface InventoryFilterRequest {
  product_id?: string;
  product_sku?: string;
  product_name?: string;
  warehouse_id?: string;
  location_id?: string;
  batch_id?: string;
  batch_number?: string;
}
