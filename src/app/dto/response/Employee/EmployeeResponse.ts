import { EmployeeStatus } from '../../../helper/enums/EmployeeStatus';

export interface EmployeeResponse {
  id: string;
  account_id: string;
  employee_code: string;

  // From user_profiles
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  date_of_birth: string;

  // From employees
  department: string;
  position: string;
  hire_date: string;
  termination_date: string;
  salary_grade: string;
  warehouse_id: string;
  status: EmployeeStatus;

  created_at: string;
  updated_at: string;
}
