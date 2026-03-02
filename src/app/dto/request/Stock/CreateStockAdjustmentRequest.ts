import { StockAdjustmentType } from '../../../helper/enums/StockAdjustmentType';

export interface CreateStockAdjustmentRequest {
  type: StockAdjustmentType;
  product_id: string;
  location_id: string;
  batch_id?: string;
  quantity_adjusted: number;
  reason: string;
  notes?: string;
}
