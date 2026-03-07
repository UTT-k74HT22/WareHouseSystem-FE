import { BusinessPartnerType } from '../../../helper/enums/BusinessPartnerType';
import { BusinessPartnerStatus } from '../../../helper/enums/BusinessPartnerStatus';

export interface BusinessPartnerResponse {
  id: string;
  code: string;
  name: string;
  type: BusinessPartnerType;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  credit_limit: number | null;
  status: BusinessPartnerStatus;
  notes: string | null;
  purchase_order_count: number | null;
  sales_order_count: number | null;
  created_at: string;
  updated_at: string;
}
