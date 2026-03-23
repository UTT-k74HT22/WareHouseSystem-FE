export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;  // epoch millis
  refreshTokenExpiresAt: number; // epoch millis
}
