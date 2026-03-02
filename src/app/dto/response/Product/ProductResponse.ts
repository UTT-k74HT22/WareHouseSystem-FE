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
  weight: number;
  length: number;
  width: number;
  height: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  is_batch_tracked: boolean;
  status: ProductStatus;
  image_url: string;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}
