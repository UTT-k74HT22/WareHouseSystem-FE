import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { BackgroundJobSummaryResponse } from '../../dto/response/BackgroundJob/BackgroundJobSummaryResponse';
import { BackgroundJobFileResponse } from '../../dto/response/BackgroundJob/BackgroundJobFileResponse';

@Injectable({ providedIn: 'root' })
export class BackgroundJobService {
  private readonly apiUrl = `${BaseURL.API_URL}jobs`;

  constructor(private http: HttpClient) {}

  getMyJobs(page = 0, size = 5): Observable<ApiResponse<PageResponse<BackgroundJobSummaryResponse>>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<ApiResponse<PageResponse<BackgroundJobSummaryResponse>>>(`${this.apiUrl}/my`, { params });
  }

  getJobDownload(jobId: string): Observable<ApiResponse<BackgroundJobFileResponse>> {
    return this.http.get<ApiResponse<BackgroundJobFileResponse>>(`${this.apiUrl}/${jobId}/download`);
  }
}
