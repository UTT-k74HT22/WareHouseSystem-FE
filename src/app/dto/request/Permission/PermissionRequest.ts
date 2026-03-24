export interface CreatePermissionRequest {
  name: string;
  resource: string;
  action: ActionType;
  description?: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  resource?: string;
  action?: ActionType;
  description?: string;
}

export enum ActionType {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}
