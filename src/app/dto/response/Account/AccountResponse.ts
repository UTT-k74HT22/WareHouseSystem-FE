import {AccountStatus} from "../../../helper/enums/AccountStatus";

export interface AccountResponse {
  id: string,
  account_id: string,
  username: string,
  status: AccountStatus | string,
  email: string | null,
  first_name: string | null,
  last_name: string | null,
  full_name?: string | null,
  created_at?: string | null,
  updated_at?: string | null
}
