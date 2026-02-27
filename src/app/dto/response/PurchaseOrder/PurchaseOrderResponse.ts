import { OrderStatus } from '../../../helper/enums/OrderStatus';

export interface PurchaseOrderResponse {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier_name: string;
  warehouse_id: string;
  warehouse_name: string;
  status: OrderStatus;
  order_date: string;
  expected_date: string;
  total_amount: number;
  currency: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}
