import { LocationStatus } from '../../../helper/enums/LocationStatus';
import { LocationType } from '../../../helper/enums/LocationType';

export interface LocationResponse {
  id: string;
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  code: string;
  name: string;
  zone: string;
  type: LocationType;
  capacity: number;
  status: LocationStatus;
  notes: string;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}
