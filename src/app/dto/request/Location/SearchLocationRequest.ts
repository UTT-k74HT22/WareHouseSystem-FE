import { LocationStatus } from '../../../helper/enums/LocationStatus';
import { LocationType } from '../../../helper/enums/LocationType';

export interface SearchLocationRequest {
  warehouse_id?: string;
  code?: string;
  name?: string;
  zone?: string;
  keyword?: string;
  type?: LocationType;
  status?: LocationStatus;
}
