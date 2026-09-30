export interface OutboundShipmentsRequest {
  sales_order_id: string;
  warehouse_id: string;
  shipment_date: string;
  shipment_time?: string;
  carrier?: string;
  notes?: string;
}

export interface UpdateOutboundShipmentsRequest {
  shipment_date?: string;
  shipment_time?: string;
  tracking_number?: string;
  carrier?: string;
  notes?: string;
}
