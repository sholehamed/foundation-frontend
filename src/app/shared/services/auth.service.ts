import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantContextService } from './tenant-context.service';
import { TokenStorageService } from './token-storage.service';

export interface AuthTokens {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
  scope?: string;
}
export type LoginContext = 'system' | 'tenant';

export interface UserInfo {
  sub: string;
  username: string;
  given_name: string;
  picture?: string | null;
  tenant?: string | null;
  tenant_id?: string | null;
  account_type: LoginContext;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  _http = inject(HttpClient);
  _tenant = inject(TenantContextService);
  _tokenStorage = inject(TokenStorageService);

  login(
    username: string,
    password: string,
    captchaCode: string,
    captchaId: string,
    login_context: string,
  ): Observable<UserInfo> {
    const body = new URLSearchParams();

    body.set('grant_type', environment.grant_type);
    body.set('client_id', environment.client_id);
    body.set('username', username);
    body.set('password', password);
    body.set('userEnteredCaptchaCode', captchaCode);
    body.set('captchaId', captchaId);
    body.set('scope', environment.scope);
    body.set('login_context', login_context);
    if (this._tenant.current) {
      body.set('tenant', this._tenant.current!.slug);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this._http.post<AuthTokens>(
  environment.apiUrl + '/system/Auth/login',
  body.toString(),
  { headers }
).pipe(
  tap(tokens => {
    this._tokenStorage.setTokens(
      tokens.access_token,
      tokens.refresh_token ?? ''
    );
  }),

  switchMap(tokens =>
    this._http.get<UserInfo>(
      environment.apiUrl + '/system/Auth/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        }
      }
    )
  ),

  tap(user => {
    this.saveUserInfo(user);
  }),

  catchError(error => {
    this._tokenStorage.clear();
    return throwError(() => error);
  })
);
  }
  CallUserInfo() {
    const accessToken = this.getAccessToken();
    if (!accessToken) return;
    this._http.get<UserInfo>(environment.apiUrl + '/system/Auth/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).subscribe({
      next: (info) => this.saveUserInfo(info),
      error: () => this._tokenStorage.clear(),
    });
  }
  getAccessToken(): string | null {
    return this._tokenStorage.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this._tokenStorage.getRefreshToken();
  }

  saveTokens(tokens: AuthTokens): void {
    this._tokenStorage.setTokens(tokens.access_token, tokens.refresh_token ?? this.getRefreshToken() ?? '');
    this.CallUserInfo();
  }
  saveUserInfo(info: UserInfo) {
    this._tokenStorage.setUserInfo(info.given_name, info.tenant_id!, info.tenant!, info.picture!,info.account_type,info.username,info.sub);
  }
  getFullName() {
    return this._tokenStorage.getUserFullname();
  }
  getUserPicture() {
    return this._tokenStorage.getUserPicture();
  }
  getUserInfo() {
    const info: UserInfo = {
      given_name: this._tokenStorage.getUserFullname()!,
      picture: this._tokenStorage.getUserPicture()!,
      tenant: this._tokenStorage.getUsertenant()!,
      tenant_id: this._tokenStorage.getUsertenantId()!,
      account_type: this._tokenStorage.getAccountType()! as LoginContext,
      username:this._tokenStorage.getUsername()!,
      sub:this._tokenStorage.getUserSub()!
    };
    return info;
  }

  refreshToken(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Refresh token not found.'));
    }

    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('client_id', environment.client_id)
      .set('refresh_token', refreshToken);

    return this._http.post<AuthTokens>(environment.apiUrl + '/system/Auth/login', body).pipe(
      tap((tokens) => {
        this.saveTokens(tokens);
      }),
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();

    // Clearing local state must never depend on the server being reachable.
    // This best-effort OAuth revocation prevents reuse of the refresh token.
    this._tokenStorage.clear();

    if (!refreshToken) return;

    const body = new HttpParams()
      .set('client_id', environment.client_id)
      .set('token', refreshToken)
      .set('token_type_hint', 'refresh_token');

    this._http.post(environment.apiUrl + '/system/Auth/revoke', body)
      .subscribe({ error: () => { /* Local session has already been cleared. */ } });
  }
}
