import { LocationStatus } from '../../../helper/enums/LocationStatus';

export interface ChangeLocationStatusRequest {
  status: LocationStatus;
  reason?: string;
}
