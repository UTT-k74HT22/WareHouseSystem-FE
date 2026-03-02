import { CategoryStatus } from '../../../helper/enums/CategoryStatus';

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  parent_id?: string;
  status?: CategoryStatus;
}
