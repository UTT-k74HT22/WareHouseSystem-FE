import { BatchStatus } from '../../../helper/enums/BatchStatus';

export interface CreateBatchRequest {
  batch_number: string;
  product_id: string;
  manufacturing_date: string;
  expiry_date?: string;
  supplier_batch_number?: string;
  status: BatchStatus;
  notes?: string;
}

export interface ChangeBatchStatusRequest {
  status: BatchStatus;
}

export interface UpdateBatchRequest {
  id: string;
  batch_number?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  supplier_batch_number?: string;
  notes?: string;
}
