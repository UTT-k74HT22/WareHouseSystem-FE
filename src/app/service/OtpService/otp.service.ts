import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { ApiResponse } from '../../dto/response/ApiResponse';
import { SendOtpRequest } from '../../dto/request/Otp/SendOtpRequest';
import { VerifyOtpRequest } from '../../dto/request/Otp/VerifyOtpRequest';

@Injectable({ providedIn: 'root' })
export class OtpService {
  private readonly apiUrl = `${BaseURL.API_URL}otp`;

  constructor(private http: HttpClient) {}

  /** POST /api/v1/otp/send */
  sendOtp(request: SendOtpRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/send`, request);
  }

  /** POST /api/v1/otp/verify */
  verifyOtp(request: VerifyOtpRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/verify`, request);
  }
}
