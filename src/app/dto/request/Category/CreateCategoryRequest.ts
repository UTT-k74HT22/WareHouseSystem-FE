import { CategoryStatus } from '../../../helper/enums/CategoryStatus';

export interface CreateCategoryRequest {
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  status?: CategoryStatus;
}
