export interface PurchaseOrderLineResponse {
  id: string;
  purchase_order_id: string;
  product_id: string;
  line_number: number;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Enriched fields (FE-only, resolved from product list)
  product_name?: string;
  product_sku?: string;
}

