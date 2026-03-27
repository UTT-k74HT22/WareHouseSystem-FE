import { SalesOrderLineResponse } from '../SalesOrderLine/SalesOrderLineResponse';

export interface SalesOrderResponse {
  id: string;
  so_number: string;
  customer_id: string;
  customer_name?: string;
  warehouse_id: string;
  warehouse_name?: string;
  order_date: string;
  requested_delivery_date: string;
  status: string;
  sub_total: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_terms?: string | null;
  notes: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  lines: SalesOrderLineResponse[];
}
