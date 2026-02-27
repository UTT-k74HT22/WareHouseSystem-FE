import { ProductStatus } from '../../../helper/enums/ProductStatus';

export interface SearchProductRequest {
  keyword?: string;
  category_id?: string;
  status?: ProductStatus;
  is_batch_tracked?: boolean;
}
