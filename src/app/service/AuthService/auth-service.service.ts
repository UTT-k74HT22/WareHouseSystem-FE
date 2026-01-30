import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {LoginRequest} from "../../dto/request/Auth/LoginRequest";
import {Observable} from "rxjs";
import {AuthResponse} from "../../dto/response/Auth/AuthResponse";

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  private readonly apiUrl = 'http://localhost:8080/api/v1/auth';

  constructor(private http: HttpClient) { }

  login (request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request);
  }
}
