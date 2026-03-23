import { ProductStatus } from '../../../helper/enums/ProductStatus';

export interface SearchProductRequest {
  sku?: string;
  name?: string;
  category_id?: string;
  uom_id?: string;
  status?: ProductStatus;
  requires_batch_tracking?: boolean;
  search_text?: string;
}
