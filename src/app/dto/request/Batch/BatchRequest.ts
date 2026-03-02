import { BatchStatus } from '../../../helper/enums/BatchStatus';

export interface CreateBatchRequest {
  batch_number: string;
  product_id: string;
  manufacture_date?: string;
  expiry_date?: string;
  quantity: number;
  supplier_id?: string;
  notes?: string;
}

export interface UpdateBatchRequest {
  batch_number?: string;
  manufacture_date?: string;
  expiry_date?: string;
  quantity?: number;
  status?: BatchStatus;
  notes?: string;
}
