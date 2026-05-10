import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
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
      catchError((error: HttpErrorResponse) => this.handleError(error, options))
    );
  }

  post(_endpoint: string, _body: unknown): Observable<never> {
    return throwError(() => new Error('ERP data source write operations are not connected yet'));
  }

  put(_endpoint: string, _body: unknown): Observable<never> {
    return throwError(() => new Error('ERP data source write operations are not connected yet'));
  }

  patch(_endpoint: string, _body: unknown, _ifMatchKey?: string): Observable<never> {
    return throwError(() => new Error('ERP data source write operations are not connected yet'));
  }

  delete(_endpoint: string): Observable<never> {
    return throwError(() => new Error('ERP data source write operations are not connected yet'));
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
    const authorization = environment.authorizationType === 'Bearer'
      ? `Bearer ${token}`
      : `${environment.authorizationType} ${token}`;

    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: authorization
    });
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
