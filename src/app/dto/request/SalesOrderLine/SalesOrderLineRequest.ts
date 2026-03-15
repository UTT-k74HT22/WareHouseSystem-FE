export interface CreateSalesOrderLineRequest {
  sales_order_id: string;
  product_id: string;
  quantity_ordered: number | null;
  unit_price: number | null;
  notes?: string;
}

export interface UpdateSalesOrderLineRequest {
  product_id?: string;
  quantity_ordered?: number;
  unit_price?: number;
  notes?: string;
}
