import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseURL } from '../../../environments/BaseURL';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import {ApiResponse} from "../../dto/response/ApiResponse";
import {PageResponse} from "../../dto/response/PageResponse";

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {

  private readonly apiUrl = `${BaseURL.API_URL}warehouse`;

  constructor(private http: HttpClient) {}

  getAll(page: number = 0, size: number = 10): Observable<ApiResponse<PageResponse<WareHouseResponse>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PageResponse<WareHouseResponse>>>(
      this.apiUrl,
      { params }
    );
  }
}
