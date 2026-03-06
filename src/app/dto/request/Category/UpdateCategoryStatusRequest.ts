import { CategoryStatus } from '../../../helper/enums/CategoryStatus';

export interface UpdateCategoryStatusRequest {
  status: CategoryStatus;
}
