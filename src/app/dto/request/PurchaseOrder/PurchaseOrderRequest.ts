import { OrderStatus } from '../../../helper/enums/OrderStatus';

export interface CreatePurchaseOrderRequest {
  supplier_id: string;
  warehouse_id: string;
  order_date: string;
  expected_delivery_date?: string;
  currency: string;
  payment_terms?: string;
  notes?: string;
}

export interface UpdatePurchaseOrderRequest {
  supplier_id?: string;
  warehouse_id?: string;
  status?: OrderStatus;
  order_date?: string;
  expected_delivery_date?: string;
  currency?: string;
  payment_terms?: string;
  notes?: string;
}
