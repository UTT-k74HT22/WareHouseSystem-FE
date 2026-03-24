export interface PermissionResponse {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}
