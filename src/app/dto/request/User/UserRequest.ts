export interface ResetUserPasswordRequest {
  new_password: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}
