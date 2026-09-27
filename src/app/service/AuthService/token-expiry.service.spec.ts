import { Subject, of } from 'rxjs';

import { TokenExpiryService } from './token-expiry.service';

describe('TokenExpiryService', () => {
  function createService(refreshResult = of({
    success: true,
    data: {
      access_token: 'new-access-token',
      expire_access_token: String(Date.now() + 30_000)
    }
  })) {
    const tokens = {
      accessToken: 'expired-access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresAt: 1,
      refreshTokenExpiresAt: Date.now() + 60_000
    };
    const authStorage = {
      getTokens: jasmine.createSpy().and.returnValue(tokens),
      getAccessTokenExpiresAt: jasmine.createSpy(),
      getRefreshTokenExpiresAt: jasmine.createSpy()
    };
    const authService = {
      sessionVersion: 1,
      getSessionVersion: jasmine.createSpy().and.callFake(function (this: any) {
        return this.sessionVersion;
      }),
      isCurrentSession: jasmine.createSpy().and.callFake(function (this: any, version: number) {
        return this.sessionVersion === version;
      }),
      refreshToken: jasmine.createSpy().and.returnValue(refreshResult),
      setSession: jasmine.createSpy(),
      logout: jasmine.createSpy()
    };
    const toastr = {
      success: jasmine.createSpy(),
      warning: jasmine.createSpy()
    };
    const router = { navigate: jasmine.createSpy() };
    const service = new TokenExpiryService(
      authStorage as any,
      authService as any,
      toastr as any,
      router as any
    );

    return { service, authService, toastr };
  }

  it('updates AuthService state after refreshing the access token', () => {
    const { service, authService } = createService();

    (service as any).refreshToken();

    expect(authService.setSession).toHaveBeenCalledWith(jasmine.objectContaining({
      accessToken: 'new-access-token',
      refreshToken: 'refresh-token'
    }));
  });

  it('ignores a refresh response from a session that has already logged out', () => {
    const response$ = new Subject<any>();
    const { service, authService, toastr } = createService(response$);

    (service as any).refreshToken();
    authService.sessionVersion++;
    response$.next({
      success: true,
      data: {
        access_token: 'stale-access-token',
        expire_access_token: String(Date.now() + 30_000)
      }
    });

    expect(authService.setSession).not.toHaveBeenCalled();
    expect(toastr.success).not.toHaveBeenCalled();
  });
});
