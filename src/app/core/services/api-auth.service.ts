import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
};

@Injectable({
  providedIn: 'root'
})
export class ApiAuthService {
  private cachedToken?: string;
  private expiresAt = 0;

  constructor(private readonly http: HttpClient) {}

  getToken(): Observable<string> {
    if ((environment.authorizationType || '').toLowerCase() === 'none') {
      return of('');
    }

    // Development uses local backend APIs and does not depend on external BC/Azure token exchange.
    if (!environment.production) {
      return of('dev-local-bearer-token');
    }

    if (this.cachedToken && Date.now() < this.expiresAt) {
      return of(this.cachedToken);
    }

    if (environment.oauthTokenApi) {
      return this.http.get<TokenResponse>(`${environment.oauthTokenApi}Auth/Token`).pipe(
        timeout(15000),
        map((response) => this.parseTokenResponse(response)),
        tap(({ token, expiresIn }) => this.cacheToken(token, expiresIn)),
        map(({ token }) => token),
        catchError(() => throwError(() => new Error('OAuth token service is unavailable for login.')))
      );
    }

    const missingConfig = this.getMissingConfig();

    if (missingConfig.length) {
      return throwError(() => new Error(`API auth configuration is missing: ${missingConfig.join(', ')}`));
    }

    const body = new HttpParams()
      .set('grant_type', 'client_credentials')
      .set('client_id', environment.clientId)
      .set('client_secret', environment.clientSecret)
      .set('scope', environment.scope);

    return this.http.post<TokenResponse>(environment.tokenUrl, body).pipe(
      timeout(15000),
      map((response) => this.parseTokenResponse(response)),
      tap(({ token, expiresIn }) => this.cacheToken(token, expiresIn)),
      map(({ token }) => token),
      catchError(() => throwError(() => new Error('Azure token endpoint is unavailable for login.')))
    );
  }


  private parseTokenResponse(response: TokenResponse): { token: string; expiresIn: number } {
    if (!response.access_token) {
      throw new Error('API auth token response did not include access_token');
    }

    return {
      token: response.access_token,
      expiresIn: response.expires_in ?? 3600
    };
  }

  private cacheToken(token: string, expiresIn: number): void {
    this.cachedToken = token;
    this.expiresAt = Date.now() + Math.max(expiresIn - 60, 0) * 1000;
  }

  private getMissingConfig(): string[] {
    const requiredConfig = [
      ['tokenUrl', environment.tokenUrl],
      ['clientId', environment.clientId],
      ['clientSecret', environment.clientSecret],
      ['scope', environment.scope]
    ];

    return requiredConfig
      .filter(([, value]) => !value || String(value).startsWith('TODO_'))
      .map(([key]) => key);
  }
}
