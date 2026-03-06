import { ReasonType } from '../../../helper/enums/ReasonType';
import { StockAdjustmentsStatus } from '../../../helper/enums/StockAdjustmentsStatus';

export interface StockAdjustmentResponse {
  id: string;
  adjustment_number: string;
  inventory_id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  batch_id: string | null;
  quantity_before: number;
  quantity_after: number;
  adjustment_quantity: number;
  reason: ReasonType;
  status: StockAdjustmentsStatus;
  notes: string | null;
  requires_approval: boolean;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}
