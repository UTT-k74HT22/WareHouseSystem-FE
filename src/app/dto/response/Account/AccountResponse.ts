import {AccountStatus} from "../../../helper/enums/AccountStatus";

export interface AccountResponse {
  id: string,
  account_id: string,
  username: string,
  status: AccountStatus,
  email: string,
  first_name: string,
  last_name: string
}
