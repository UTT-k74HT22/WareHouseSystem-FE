import { BatchStatus } from '../../../helper/enums/BatchStatus';

export interface CreateBatchRequest {
  product_id: string;
  manufacturing_date: string;
  expiry_date?: string;
  supplier_batch_number?: string;
  notes?: string;
}

export interface UpdateBatchRequest {
  manufacturing_date?: string;
  expiry_date?: string;
  supplier_batch_number?: string;
  notes?: string;
}

export interface QuarantineBatchRequest {
  reason: string;
}

export interface ReleaseBatchRequest {
  release_notes: string;
}
