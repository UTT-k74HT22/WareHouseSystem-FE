import { ProductStatus } from '../../../helper/enums/ProductStatus';

export interface CreateProductRequest {
  name: string;
  description?: string;
  category_id: string;
  uom_id: string;
  weight?: number;
  dimensions?: string;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_point?: number;
  cost_price?: number;
  selling_price?: number;
  barcode?: string;
  requires_batch_tracking?: boolean;
  status?: ProductStatus;
  image_url?: string;
}
