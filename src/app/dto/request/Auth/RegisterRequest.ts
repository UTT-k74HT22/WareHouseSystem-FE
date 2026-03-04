export interface RegisterRequest {
  username: string;
  password: string;
  confirm_password: string;
  full_name: string;
  email: string;
  phone_number?: string;
}
