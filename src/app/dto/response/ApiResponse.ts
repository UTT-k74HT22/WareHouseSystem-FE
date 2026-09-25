import { FieldError } from './FieldError';

export interface ApiResponse<T> {
  success: boolean;
  error_code: string | null;
  message: string | null;
  data: T;
  field_errors: FieldError[] | null;
  timestamp: string;
}

export interface ApiErrorBody {
  success?: false;
  error_code?: string | null;
  errorCode?: string | null;
  message?: string | null;
  field_errors?: FieldError[] | null;
  retry_after?: number;
  timestamp?: string;
}
