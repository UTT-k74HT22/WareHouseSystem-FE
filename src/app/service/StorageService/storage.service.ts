import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { FileUploadResponse } from '../../dto/response/Storage/FileUploadResponse';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly apiUrl = `${BaseURL.API_URL}storage`;

  constructor(private http: HttpClient) {}

  /** POST /api/v1/storage/upload */
  uploadFile(file: File, folder = 'uploads'): Observable<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    const params = new HttpParams().set('folder', folder);
    return this.http.post<ApiResponse<FileUploadResponse>>(`${this.apiUrl}/upload`, formData, { params });
  }

  /** POST /api/v1/storage/upload/batch */
  uploadFiles(files: File[], folder = 'uploads'): Observable<ApiResponse<FileUploadResponse[]>> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const params = new HttpParams().set('folder', folder);
    return this.http.post<ApiResponse<FileUploadResponse[]>>(`${this.apiUrl}/upload/batch`, formData, { params });
  }

  /** GET /api/v1/storage/presigned-url */
  getPresignedUrl(objectName: string): Observable<ApiResponse<{ presignedUrl: string }>> {
    const params = new HttpParams().set('objectName', objectName);
    return this.http.get<ApiResponse<{ presignedUrl: string }>>(`${this.apiUrl}/presigned-url`, { params });
  }

  /** DELETE /api/v1/storage/:objectName */
  deleteFile(objectName: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${objectName}`);
  }

  /** GET /api/v1/storage/exists */
  fileExists(objectName: string): Observable<ApiResponse<{ exists: boolean }>> {
    const params = new HttpParams().set('objectName', objectName);
    return this.http.get<ApiResponse<{ exists: boolean }>>(`${this.apiUrl}/exists`, { params });
  }
}
