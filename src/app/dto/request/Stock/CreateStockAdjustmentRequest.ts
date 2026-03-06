import { ReasonType } from '../../../helper/enums/ReasonType';

export interface CreateStockAdjustmentRequest {
  inventory_id: string;
  quantity_after: number;
  reason: ReasonType;
  notes?: string;
}
