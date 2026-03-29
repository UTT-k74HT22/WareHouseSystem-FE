export interface BackgroundJobSummaryResponse {
  id: string;
  job_code: string;
  job_type: string;
  business_type: string;
  status: string;
  current_step: string | null;
  progress_percent: number;
  processed_rows: number;
  total_rows: number;
  requested_by: string;
  result_file_name: string | null;
  error_code: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  cancellable: boolean;
  retryable: boolean;
}
