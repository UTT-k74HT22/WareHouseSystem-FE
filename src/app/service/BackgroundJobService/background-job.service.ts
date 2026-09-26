import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { BackgroundJobSummaryResponse } from '../../dto/response/BackgroundJob/BackgroundJobSummaryResponse';
import { BackgroundJobFileResponse } from '../../dto/response/BackgroundJob/BackgroundJobFileResponse';

export interface BackgroundJobFilter {
  jobTypes?: string[];
  statuses?: string[];
  businessType?: string;
  jobCode?: string;
  createdFrom?: string;
  createdTo?: string;
}

@Injectable({ providedIn: 'root' })
export class BackgroundJobService {
  private readonly apiUrl = `${BaseURL.API_URL}jobs`;

  constructor(private http: HttpClient) {}

  getMyJobs(page = 0, size = 5, filter: BackgroundJobFilter = {}): Observable<ApiResponse<PageResponse<BackgroundJobSummaryResponse>>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    (filter.jobTypes || []).forEach(t => { params = params.append('jobTypes', t); });
    (filter.statuses || []).forEach(s => { params = params.append('statuses', s); });
    if (filter.businessType?.trim()) {
      params = params.set('businessType', filter.businessType.trim());
    }
    if (filter.jobCode?.trim()) {
      params = params.set('jobCode', filter.jobCode.trim());
    }
    if (filter.createdFrom) {
      params = params.set('createdFrom', filter.createdFrom);
    }
    if (filter.createdTo) {
      params = params.set('createdTo', filter.createdTo);
    }

    return this.http.get<ApiResponse<PageResponse<BackgroundJobSummaryResponse>>>(`${this.apiUrl}/my`, { params });
  }

  getJobDownload(jobId: string): Observable<ApiResponse<BackgroundJobFileResponse>> {
    return this.http.get<ApiResponse<BackgroundJobFileResponse>>(`${this.apiUrl}/${jobId}/download`);
  }

  retryJob(jobId: string, reason?: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/${jobId}/retry`, reason?.trim() ? { reason } : {});
  }

  cancelJob(jobId: string, reason?: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/${jobId}/cancel`, reason?.trim() ? { reason } : {});
  }
}
