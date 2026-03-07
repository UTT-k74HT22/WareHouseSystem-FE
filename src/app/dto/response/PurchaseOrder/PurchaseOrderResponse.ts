import { OrderStatus } from '../../../helper/enums/OrderStatus';

export interface PurchaseOrderResponse {
  id: string;
  purchase_order_number: string;
  supplier_id: string;
  supplier_name?: string;
  warehouse_id: string;
  warehouse_name?: string;
  status: OrderStatus;
  order_date: string;
  expected_delivery_date: string | null;
  sub_total: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_terms: string | null;
  notes: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
}
