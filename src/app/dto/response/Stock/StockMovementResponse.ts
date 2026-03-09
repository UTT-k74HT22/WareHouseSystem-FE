import { StockMovementType } from '../../../helper/enums/StockMovementType';
import { ReferenceType } from '../../../helper/enums/ReferenceType';

export interface StockMovementResponse {
  id: string;
  movement_type: StockMovementType;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  warehouse_id: string;
  warehouse_name?: string;
  location_id: string;
  location_code?: string;
  batch_id: string | null;
  batch_number?: string | null;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  movement_date: string;
  uom_code?: string;
  reference_type: ReferenceType;
  reference_id: string;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}
