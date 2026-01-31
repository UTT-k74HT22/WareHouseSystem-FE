export interface ApiResponse<T> {
  success: boolean;
  error_code: string | null;
  message: string | null;
  data: T;
  field_errors: any;
  timestamp: string;
}
