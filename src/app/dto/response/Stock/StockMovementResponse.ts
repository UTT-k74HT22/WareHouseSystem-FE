import { StockMovementType } from '../../../helper/enums/StockMovementType';

export interface StockMovementResponse {
  id: string;
  movement_number: string;
  type: StockMovementType;
  product_id: string;
  product_name: string;
  product_sku: string;
  from_location_id: string | null;
  from_location_code: string | null;
  to_location_id: string | null;
  to_location_code: string | null;
  batch_id: string | null;
  batch_number: string | null;
  quantity: number;
  uom_code: string;
  reference_type: string;
  reference_id: string;
  notes: string;
  created_by: string;
  created_at: string;
}
