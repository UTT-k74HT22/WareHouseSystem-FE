import { CategoryStatus } from '../../../helper/enums/CategoryStatus';

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  // chỉ dùng cho PATCH /{id}/status, PUT bỏ qua
  status?: CategoryStatus;
}
