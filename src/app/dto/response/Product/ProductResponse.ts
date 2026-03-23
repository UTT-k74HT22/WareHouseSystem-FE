import { ProductStatus } from '../../../helper/enums/ProductStatus';

export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  description: string;
  category_id: string;
  category_name: string;
  uom_id: string;
  uom_name: string;
  uom_code: string;
  weight: number | null;
  dimensions: string | null;
  min_stock_level: number | null;
  max_stock_level: number | null;
  reorder_point: number | null;
  cost_price: number | null;
  selling_price: number | null;
  barcode: string | null;
  requires_batch_tracking: boolean | null;
  status: ProductStatus;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}
