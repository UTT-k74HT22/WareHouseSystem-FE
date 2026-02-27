import { BusinessPartnerType } from '../../../helper/enums/BusinessPartnerType';
import { BusinessPartnerStatus } from '../../../helper/enums/BusinessPartnerStatus';

export interface BusinessPartnerResponse {
  id: string;
  code: string;
  name: string;
  type: BusinessPartnerType;
  email: string | null;
  phone: string | null;
  address: string;
  tax_code: string;
  contact_person: string | null;
  status: BusinessPartnerStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}
