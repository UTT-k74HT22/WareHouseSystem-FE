export interface CreateEmployeeRequest {
  username: string;
  password: string;
  roles: string[];
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  department?: string;
  position?: string;
  hire_date?: string;
}
