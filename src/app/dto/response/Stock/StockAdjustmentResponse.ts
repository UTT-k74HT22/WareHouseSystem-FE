import { StockAdjustmentType } from '../../../helper/enums/StockAdjustmentType';

export interface StockAdjustmentResponse {
  id: string;
  adjustment_number: string;
  type: StockAdjustmentType;
  product_id: string;
  product_name: string;
  product_sku: string;
  location_id: string;
  location_code: string;
  batch_id: string | null;
  batch_number: string | null;
  quantity_before: number;
  quantity_adjusted: number;
  quantity_after: number;
  uom_code: string;
  reason: string;
  notes: string;
  created_by: string;
  created_at: string;
}
