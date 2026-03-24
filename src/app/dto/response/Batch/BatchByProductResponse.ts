export interface BatchByProductResponse {
  batch_id: string;
  batch_number: string;
  product_id: string;
  product_sku?: string | null;
  product_name?: string | null;
  status: string;
  manufacturing_date?: string | null;
  expiry_date?: string | null;
  supplier_batch_number?: string | null;
  notes?: string | null;
  inventory_snapshot?: {
    total_available_quantity?: number;
    warehouses?: Array<{
      warehouse_id?: string;
      warehouse_name?: string;
      available_quantity?: number;
      locations?: Array<{
        location_id?: string;
        location_name?: string;
        location_code?: string;
        available_quantity?: number;
      }>;
    }>;
  };
}
