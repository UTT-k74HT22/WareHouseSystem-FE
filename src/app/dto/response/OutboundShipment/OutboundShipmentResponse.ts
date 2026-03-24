import { OutboundShipmentLinesResponse } from '../OutboundShipmentLine/OutboundShipmentLineResponse';

export interface OutboundShipmentsResponse {
  id: string;
  shipment_number?: string;
  shipmentNumber?: string;
  sales_order_id?: string;
  salesOrderId?: string;
  warehouse_id?: string;
  warehouseId?: string;
  shipment_date?: string;
  shipmentDate?: string;
  status: string;
  tracking_number?: string | null;
  trackingNumber?: string | null;
  carrier: string | null;
  shipped_at?: string | null;
  shippedAt?: string | null;
  confirmed_by?: string | null;
  confirmedBy?: string | null;
  notes: string | null;
  lines?: OutboundShipmentLinesResponse[];
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  created_by?: string;
  createdBy?: string;
  updated_by?: string;
  updatedBy?: string;
}
