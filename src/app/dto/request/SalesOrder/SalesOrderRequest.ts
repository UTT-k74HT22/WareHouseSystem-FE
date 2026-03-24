import { CreateSalesOrderLineRequest } from '../SalesOrderLine/SalesOrderLineRequest';

export interface CreateSalesOrderRequest {
  customer_id: string;
  warehouse_id: string;
  order_date: string;
  requested_delivery_date: string;
  currency: string;
  notes?: string;
  lines: CreateSalesOrderLineRequest[];
}

export interface UpdateSalesOrderRequest {
  customer_id?: string;
  warehouse_id?: string;
  order_date?: string;
  requested_delivery_date?: string;
  currency?: string;
  notes?: string;
}
