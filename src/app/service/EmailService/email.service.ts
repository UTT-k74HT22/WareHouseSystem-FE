import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { PageResponse } from '../../dto/response/PageResponse';
import { EmailLogResponse } from '../../dto/response/Email/EmailLogResponse';
import { SendEmailRequest } from '../../dto/request/Email/SendEmailRequest';
import { EmailStatus } from '../../helper/enums/EmailStatus';
import { EmailType } from '../../helper/enums/EmailType';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private readonly apiUrl = `${BaseURL.API_URL}emails`;

  constructor(private http: HttpClient) {}

  /** POST /api/v1/emails/send */
  sendEmail(request: SendEmailRequest): Observable<EmailLogResponse> {
    return this.http.post<EmailLogResponse>(`${this.apiUrl}/send`, request);
  }

  /** GET /api/v1/emails/:id */
  getById(id: string): Observable<EmailLogResponse> {
    return this.http.get<EmailLogResponse>(`${this.apiUrl}/${id}`);
  }

  /** GET /api/v1/emails */
  getAll(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'DESC'): Observable<PageResponse<EmailLogResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    return this.http.get<PageResponse<EmailLogResponse>>(this.apiUrl, { params });
  }

  /** GET /api/v1/emails/status/:status */
  getByStatus(status: EmailStatus, page = 0, size = 10): Observable<PageResponse<EmailLogResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<EmailLogResponse>>(`${this.apiUrl}/status/${status}`, { params });
  }

  /** GET /api/v1/emails/type/:type */
  getByType(type: EmailType, page = 0, size = 10): Observable<PageResponse<EmailLogResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<EmailLogResponse>>(`${this.apiUrl}/type/${type}`, { params });
  }

  /** GET /api/v1/emails/recipient/:email */
  getByRecipient(email: string, page = 0, size = 10): Observable<PageResponse<EmailLogResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<EmailLogResponse>>(`${this.apiUrl}/recipient/${email}`, { params });
  }

  /** POST /api/v1/emails/:id/retry */
  retryEmail(id: string): Observable<EmailLogResponse> {
    return this.http.post<EmailLogResponse>(`${this.apiUrl}/${id}/retry`, {});
  }

  /** GET /api/v1/emails/statistics */
  getStatistics(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/statistics`);
  }

  /** POST /api/v1/emails/process-pending */
  processPending(): Observable<string> {
    return this.http.post(`${this.apiUrl}/process-pending`, {}, { responseType: 'text' });
  }

  /** POST /api/v1/emails/retry-failed */
  retryFailed(): Observable<string> {
    return this.http.post(`${this.apiUrl}/retry-failed`, {}, { responseType: 'text' });
  }
}
