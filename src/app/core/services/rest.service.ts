import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UnicodeNormalizer } from '../utils/unicode-normalizer';
import { ApiAuthService } from './api-auth.service';
import { SessionService } from './session.service';

export type RestRequestOptions = {
  suppressGlobalErrorDialog?: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class RestService {
  constructor(
    private readonly http: HttpClient,
    private readonly auth: ApiAuthService,
    private readonly sessionService: SessionService
  ) {}

  get(endpoint: string, options?: RestRequestOptions): Observable<unknown> {
    if (!environment.apiBaseUrl) {
      return throwError(() => new Error('API base URL is not configured'));
    }

    return this.getAuthorizationToken().pipe(
      switchMap((token) => this.http.get(this.buildUrl(endpoint), {
        headers: this.createHeaders(token)
      })),
      map((response) => UnicodeNormalizer.normalize(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, options))
    );
  }

  post(endpoint: string, body: unknown, options?: RestRequestOptions): Observable<unknown> {
    if (!environment.apiBaseUrl) {
      return throwError(() => new Error('API base URL is not configured'));
    }

    return this.getAuthorizationToken().pipe(
      switchMap((token) => this.http.post(this.buildUrl(endpoint), body, {
        headers: this.createHeaders(token)
      })),
      map((response) => UnicodeNormalizer.normalize(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, options))
    );
  }

  put(endpoint: string, body: unknown, options?: RestRequestOptions): Observable<unknown> {
    if (!environment.apiBaseUrl) {
      return throwError(() => new Error('API base URL is not configured'));
    }

    return this.getAuthorizationToken().pipe(
      switchMap((token) => this.http.put(this.buildUrl(endpoint), body, {
        headers: this.createHeaders(token)
      })),
      map((response) => UnicodeNormalizer.normalize(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, options))
    );
  }

  patch(endpoint: string, body: unknown, ifMatchKey = '*', options?: RestRequestOptions): Observable<unknown> {
    if (!environment.apiBaseUrl) {
      return throwError(() => new Error('API base URL is not configured'));
    }

    return this.getAuthorizationToken().pipe(
      switchMap((token) => this.http.patch(this.buildUrl(endpoint), body, {
        headers: this.createHeaders(token).set('If-Match', ifMatchKey)
      })),
      map((response) => UnicodeNormalizer.normalize(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, options))
    );
  }

  delete(endpoint: string, options?: RestRequestOptions): Observable<unknown> {
    if (!environment.apiBaseUrl) {
      return throwError(() => new Error('API base URL is not configured'));
    }

    return this.getAuthorizationToken().pipe(
      switchMap((token) => this.http.delete(this.buildUrl(endpoint), {
        headers: this.createHeaders(token)
      })),
      map((response) => UnicodeNormalizer.normalize(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, options))
    );
  }

  private buildUrl(endpoint: string): string {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    if (normalizedEndpoint.includes('/companies')) {
      return `${environment.apiBaseUrl}${normalizedEndpoint}`;
    }

    if (this.sessionService.Company) {
      return `${environment.apiBaseUrl}/companies(${this.sessionService.Company})${normalizedEndpoint}`;
    }

    return `${environment.apiBaseUrl}${normalizedEndpoint}`;
  }

  private getAuthorizationToken(): Observable<string> {
    if ((environment.authorizationType || '').toLowerCase() === 'none') {
      return of('');
    }

    if (environment.authorizationType === 'Bearer') {
      if (this.sessionService.AccessToken) {
        return of(this.sessionService.AccessToken);
      }

      return this.auth.getToken().pipe(
        tap((token) => {
          this.sessionService.AccessToken = token;
        })
      );
    }

    if (!environment.username || !environment.password) {
      return throwError(() => new Error('Basic API auth configuration is missing: username, password'));
    }

    return of(btoa(`${environment.username}:${environment.password}`));
  }

  private createHeaders(token: string): HttpHeaders {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if ((environment.authorizationType || '').toLowerCase() !== 'none') {
      const authorization = environment.authorizationType === 'Bearer'
        ? `Bearer ${token}`
        : `${environment.authorizationType} ${token}`;

      headers['Authorization'] = authorization;
    }

    return new HttpHeaders(headers);
  }

  private handleError(error: HttpErrorResponse, options?: RestRequestOptions): Observable<never> {
    if (error.status === 401) {
      this.sessionService.logout('unauthorized');
    }

    if (!options?.suppressGlobalErrorDialog) {
      const message = error.error?.error?.message || error.error?.message || error.message;
      console.error('REST request failed:', message);
    }

    return throwError(() => error);
  }
}
