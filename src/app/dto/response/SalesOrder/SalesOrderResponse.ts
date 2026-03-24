import { SalesOrderLineResponse } from '../SalesOrderLine/SalesOrderLineResponse';

export interface SalesOrderResponse {
  id: string;
  so_number: string;
  customer_id: string;
  warehouse_id: string;
  order_date: string;
  requested_delivery_date: string;
  status: string;
  sub_total: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
  lines: SalesOrderLineResponse[];
}
