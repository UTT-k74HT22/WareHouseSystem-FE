import { OrderStatus } from '../../../helper/enums/OrderStatus';

export interface SalesOrderResponse {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  warehouse_id: string;
  warehouse_name: string;
  status: OrderStatus;
  order_date: string;
  expected_date: string;
  total_amount: number;
  currency: string;
  notes: string;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}
