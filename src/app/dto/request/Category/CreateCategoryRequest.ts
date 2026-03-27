import { CategoryStatus } from '../../../helper/enums/CategoryStatus';

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  status: CategoryStatus;
}
