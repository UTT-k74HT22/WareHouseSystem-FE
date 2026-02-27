import { OrderStatus } from '../../../helper/enums/OrderStatus';

export interface CreatePurchaseOrderRequest {
  supplier_id: string;
  warehouse_id: string;
  expected_date?: string;
  currency?: string;
  notes?: string;
}

export interface UpdatePurchaseOrderRequest {
  supplier_id?: string;
  warehouse_id?: string;
  status?: OrderStatus;
  expected_date?: string;
  notes?: string;
}
