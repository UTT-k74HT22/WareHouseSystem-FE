import { ProductStatus } from '../../../helper/enums/ProductStatus';

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  category_id: string;
  uom_id: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_point?: number;
  is_batch_tracked?: boolean;
  status?: ProductStatus;
  image_url?: string;
}
