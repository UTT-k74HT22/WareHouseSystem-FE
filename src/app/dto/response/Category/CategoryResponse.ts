import { CategoryStatus } from '../../../helper/enums/CategoryStatus';

export interface CategoryResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: CategoryStatus;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}
