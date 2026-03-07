import { BusinessPartnerType } from '../../../helper/enums/BusinessPartnerType';
import { BusinessPartnerStatus } from '../../../helper/enums/BusinessPartnerStatus';

export interface CreateBusinessPartnerRequest {
  code: string;
  name: string;
  type: BusinessPartnerType;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: number;
  status: BusinessPartnerStatus;
  notes?: string;
}
