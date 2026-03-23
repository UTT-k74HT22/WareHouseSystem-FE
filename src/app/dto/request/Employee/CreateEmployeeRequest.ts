import { RoleType } from '../../../helper/enums/RoleType';

export interface CreateEmployeeRequest {
  username: string;
  password: string;
  role: RoleType;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  employee_code: string;
  department?: string;
  position?: string;
  hire_date?: string;
}
