export interface FileUploadResponse {
  object_name: string;
  original_file_name: string;
  content_type: string;
  size: number;
  presigned_url: string;
  presigned_url_expires_at: string;
}
