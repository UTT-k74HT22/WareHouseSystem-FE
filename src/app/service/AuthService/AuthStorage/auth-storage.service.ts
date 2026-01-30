// core/auth/auth-storage.service.ts
import { Injectable } from '@angular/core';
import {AuthTokens} from "../../../dto/response/Auth/AuthTokens";
const ACCESS_TOKEN_KEY = 'whs.access_token';
const REFRESH_TOKEN_KEY = 'whs.refresh_token';
const ACCESS_EXPIRES_KEY = 'whs.access_expires_at';
const REFRESH_EXPIRES_KEY = 'whs.refresh_expires_at';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {

  saveTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(ACCESS_EXPIRES_KEY, tokens.accessTokenExpiresAt.toString());
    localStorage.setItem(REFRESH_EXPIRES_KEY, tokens.refreshTokenExpiresAt.toString());
  }

  getTokens(): AuthTokens | null {
    const access = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    const accessExpires = localStorage.getItem(ACCESS_EXPIRES_KEY);
    const refreshExpires = localStorage.getItem(REFRESH_EXPIRES_KEY);

    if (!access || !refresh || !accessExpires || !refreshExpires) {
      return null;
    }

    return {
      accessToken: access,
      refreshToken: refresh,
      accessTokenExpiresAt: Number(accessExpires),
      refreshTokenExpiresAt: Number(refreshExpires)
    };
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_EXPIRES_KEY);
    localStorage.removeItem(REFRESH_EXPIRES_KEY);
  }
}
