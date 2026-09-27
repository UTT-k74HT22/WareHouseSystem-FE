import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BaseURL } from '../../../environments/BaseURL';
import { AuthService } from './auth-service.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    service = TestBed.inject(AuthService);
    expect(service).toBeTruthy();
  });

  it('restores tokens without starting an HTTP request in the constructor', () => {
    const payload = btoa(JSON.stringify({ sub: 'admin', roles: ['ADMIN'] }));
    localStorage.setItem('whs.access_token', `header.${payload}.signature`);
    localStorage.setItem('whs.refresh_token', 'refresh-token');
    localStorage.setItem('whs.access_expires_at', String(Date.now() + 60_000));
    localStorage.setItem('whs.refresh_expires_at', String(Date.now() + 120_000));

    service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getAccessToken()).toContain(payload);
    httpTestingController.expectNone(`${BaseURL.API_URL}auth/my-permissions`);
  });

  it('does not apply permissions returned for an old session', () => {
    service = TestBed.inject(AuthService);
    const payload = btoa(JSON.stringify({ sub: 'admin', roles: ['ADMIN'] }));
    service.setSession({
      accessToken: `header.${payload}.signature`,
      refreshToken: 'old-refresh-token',
      accessTokenExpiresAt: Date.now() + 60_000,
      refreshTokenExpiresAt: Date.now() + 120_000
    });

    const request = httpTestingController.expectOne(`${BaseURL.API_URL}auth/my-permissions`);
    service.logout();
    request.flush({ success: true, data: { permissions: ['PERM_ADMIN'] } });

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getPermissions()).toEqual([]);
  });
});
