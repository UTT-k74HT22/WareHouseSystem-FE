import { OutboundShipmentStatus } from '../../../helper/enums/OutboundShipmentStatus';

export interface OutboundShipmentResponse {
  id: string;
  shipment_number: string;
  sales_order_id: string | null;
  sales_order_number: string | null;
  customer_id: string;
  customer_name: string;
  warehouse_id: string;
  warehouse_name: string;
  status: OutboundShipmentStatus;
  expected_date: string;
  shipped_date: string;
  carrier: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}
