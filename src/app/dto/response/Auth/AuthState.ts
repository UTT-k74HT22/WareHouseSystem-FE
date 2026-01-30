import {AuthTokens} from "./AuthTokens";

export interface AuthState {
  isAuthenticated: boolean;
  tokens: AuthTokens | null;
  username: string | null;
  roles: string[];
}
