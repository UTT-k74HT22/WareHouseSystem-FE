import { LocationStatus } from '../../../helper/enums/LocationStatus';
import { LocationType } from '../../../helper/enums/LocationType';

export interface CreateLocationRequest {
  warehouse_id: string;
  name: string;
  zone?: string;
  type: LocationType;
  capacity: number;
  status?: LocationStatus;
  notes?: string;
}

export type UpdateLocationRequest = Partial<Omit<CreateLocationRequest, 'warehouse_id' | 'status'>> & {
  // chỉ dùng cho PATCH /{id}/status, PUT bỏ qua
  status?: LocationStatus;
  reason?: string;
};
