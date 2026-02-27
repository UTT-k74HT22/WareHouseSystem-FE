import { OutboundShipmentStatus } from '../../../helper/enums/OutboundShipmentStatus';

export interface CreateOutboundShipmentRequest {
  sales_order_id?: string;
  customer_id: string;
  warehouse_id: string;
  expected_date?: string;
  carrier?: string;
  notes?: string;
}

export interface UpdateOutboundShipmentRequest {
  status?: OutboundShipmentStatus;
  shipped_date?: string;
  tracking_number?: string;
  carrier?: string;
  notes?: string;
}
