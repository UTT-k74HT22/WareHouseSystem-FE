import { BatchStatus } from '../../../helper/enums/BatchStatus';

export interface BatchResponse {
  id: string;
  batch_number: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  manufacturing_date: string;
  expiry_date: string;
  supplier_batch_number: string | null;
  status: BatchStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}
