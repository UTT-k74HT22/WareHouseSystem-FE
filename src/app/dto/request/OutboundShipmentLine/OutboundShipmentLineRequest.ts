export interface OutboundShipmentLinesRequest {
  outbound_shipment_id: string;
  sales_order_line_id: string;
  product_id: string;
  location_id?: string;
  batch_id?: string;
  quantity_shipped: number;
  notes?: string;
}

export interface UpdateOutboundShipmentLinesRequest {
  location_id?: string;
  batch_id?: string;
  quantity_shipped?: number;
  notes?: string;
}
