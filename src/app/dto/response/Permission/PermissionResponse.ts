import { ActionType } from '../../request/Permission/PermissionRequest';

export interface PermissionResponse {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: ActionType;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface CheckPermissionResponse {
  allowed: boolean;
}

export interface MyPermissionsResponse {
  permissions: string[];
}
