import { LocationStatus } from '../../../helper/enums/LocationStatus';
import { LocationType } from '../../../helper/enums/LocationType';

export interface CreateLocationRequest {
  warehouse_id: string;
  code: string;
  name: string;
  zone?: string;
  type: LocationType;
  capacity: number;
  status?: LocationStatus;
  notes?: string;
}
