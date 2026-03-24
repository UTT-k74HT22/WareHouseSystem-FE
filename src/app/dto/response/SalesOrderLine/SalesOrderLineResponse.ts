export interface SalesOrderLineResponse {
  id: string;
  sales_order_id: string;
  product_id: string;
  line_number: number;
  quantity_ordered: number;
  quantity_shipped: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;

  product_name?: string;
  product_sku?: string;
}

export type SalesOrderLinesResponse = SalesOrderLineResponse;
