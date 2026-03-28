export interface CreateRoleRequest {
  name: string;
  description?: string;
  is_default?: boolean;
  isDefault?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  is_default?: boolean;
  isDefault?: boolean;
}

export interface AssignPermissionsRequest {
  permission_ids: string[];
}

export interface AssignRolesRequest {
  role_ids: string[];
}
