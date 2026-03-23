import { StockTransferReason } from '../../../helper/enums/StockTransferReason';
import { StockTransferStatus } from '../../../helper/enums/StockTransferStatus';

export interface StockTransferResponse {
  id: string;
  transfer_number: string;
  product_id: string;
  warehouse_id: string;
  from_location_id: string;
  to_location_id: string;
  batch_id: string | null;
  quantity: number;
  reason: StockTransferReason;
  notes: string | null;
  status: StockTransferStatus;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}
