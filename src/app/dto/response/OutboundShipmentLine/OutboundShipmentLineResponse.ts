export interface OutboundShipmentLinesResponse {
  id: string;
  outbound_shipment_id?: string;
  sales_order_line_id?: string;
  product_id?: string;
  sku: string;
  product_name?: string;
  batch_id?: string | null;
  batch_number?: string | null;
  location_id?: string;
  location_name?: string;
  line_number?: number;
  quantity_shipped?: number;
  picked_at?: string | null;
  picked_by?: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}
