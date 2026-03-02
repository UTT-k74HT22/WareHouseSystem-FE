import { CategoryStatus } from '../../../helper/enums/CategoryStatus';

export interface CategoryResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  parent_name: string | null;
  status: CategoryStatus;
  product_count: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}
