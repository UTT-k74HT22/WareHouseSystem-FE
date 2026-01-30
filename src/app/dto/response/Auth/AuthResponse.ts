export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expire_access_token: string;
  expire_refresh_token: string;
  ip: string | null;
}
