export interface BackgroundJobFileResponse {
  file_name: string;
  storage_object_key: string;
  mime_type: string;
  file_size: number;
  download_url: string;
  download_url_expires_at: string;
}
