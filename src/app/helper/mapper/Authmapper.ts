import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import {AuthTokens} from "../../dto/response/Auth/AuthTokens";
import {AuthState} from "../../dto/response/Auth/AuthState";
import {AuthResponse} from "../../dto/response/Auth/AuthResponse";

export interface JwtPayload {
  sub?: string;
  roles?: string[];
  exp?: number;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthMapper {

  /**
   * Chuyển đổi dữ liệu thô từ Backend sang định dạng Tokens của Frontend
   */
  mapToTokens(response: AuthResponse): AuthTokens {
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      accessTokenExpiresAt: Number(response.expire_access_token),
      refreshTokenExpiresAt: Number(response.expire_refresh_token)
    };
  }

  /**
   * Giải mã token và tạo ra AuthState mới
   */
  mapToState(tokens: AuthTokens): AuthState {
    const payload = this.decodeToken(tokens.accessToken);
    return {
      isAuthenticated: !!tokens.accessToken,
      tokens,
      username: payload?.sub ?? null,
      roles: payload?.roles ?? []
    };
  }

  /**
   * Tạo state mặc định khi chưa đăng nhập hoặc logout
   */
  getInitialState(): AuthState {
    return {
      isAuthenticated: false,
      tokens: null,
      username: null,
      roles: []
    };
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }
}
