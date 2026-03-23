import { StockTransferReason } from '../../../helper/enums/StockTransferReason';

export interface CreateStockTransferRequest {
  product_id: string;
  warehouse_id: string;
  from_location_id: string;
  to_location_id: string;
  batch_id?: string;
  quantity: number;
  reason: StockTransferReason;
  notes?: string;
}
