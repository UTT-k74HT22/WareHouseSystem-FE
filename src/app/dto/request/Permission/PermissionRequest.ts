export interface CreatePermissionRequest {
  name: string;
  resource: string;
  action: ActionType;
  description?: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
}

export enum ActionType {
  CREATE = 'CREATE',
  READ = 'READ',
  WRITE = 'WRITE',
  UPDATE = 'UPDATE',
  EXPORT = 'EXPORT',
  DELETE = 'DELETE'
}

export interface CheckPermissionRequest {
  resource: string;
  action: ActionType;
}
