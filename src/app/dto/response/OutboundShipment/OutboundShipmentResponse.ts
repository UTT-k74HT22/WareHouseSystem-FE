import { OutboundShipmentLinesResponse } from '../OutboundShipmentLine/OutboundShipmentLineResponse';

export interface OutboundShipmentsResponse {
  id: string;
  shipment_number?: string;
  sales_order_id?: string;
  warehouse_id?: string;
  shipment_date?: string;
  status: string;
  tracking_number?: string | null;
  carrier: string | null;
  shipped_at?: string | null;
  confirmed_by?: string | null;
  notes: string | null;
  lines?: OutboundShipmentLinesResponse[];
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}
