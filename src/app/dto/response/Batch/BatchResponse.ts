import { BatchStatus } from '../../../helper/enums/BatchStatus';

export interface BatchResponse {
  id: string;
  batch_number: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  manufacture_date: string;
  expiry_date: string;
  quantity: number;
  status: BatchStatus;
  supplier_id: string;
  supplier_name: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}
