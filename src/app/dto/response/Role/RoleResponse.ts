import { PermissionResponse } from '../Permission/PermissionResponse';

export interface RoleResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  permissions: PermissionResponse[] | null;
  permission_count: number | null;
  user_count: number | null;
}
