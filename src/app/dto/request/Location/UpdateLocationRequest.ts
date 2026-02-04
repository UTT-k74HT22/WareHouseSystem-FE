import { LocationType } from '../../../helper/enums/LocationType';

export interface UpdateLocationRequest {
  name?: string;
  zone?: string;
  type?: LocationType;
  capacity?: number;
  notes?: string;
}
