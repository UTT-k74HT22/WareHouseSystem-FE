import { BusinessPartnerType } from '../../../helper/enums/BusinessPartnerType';
import { BusinessPartnerStatus } from '../../../helper/enums/BusinessPartnerStatus';

export interface UpdateBusinessPartnerRequest {
  name?: string;
  type?: BusinessPartnerType;
  email?: string;
  phone?: string;
  address?: string;
  tax_code?: string;
  contact_person?: string;
  status?: BusinessPartnerStatus;
  notes?: string;
}
