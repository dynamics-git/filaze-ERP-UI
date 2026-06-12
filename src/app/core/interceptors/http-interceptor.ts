import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, EMPTY, map, Observable, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {
  constructor(private readonly sessionService: SessionService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.sessionService.AccessToken;
    const hasAuthorizationHeader = request.headers.has('Authorization');
    const requestWithToken = token && !hasAuthorizationHeader
      ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
      : request;

    if (
      requestWithToken.url.includes('Microsoft.NAV') &&
      !this.sessionService.DefaultAccessCenter &&
      !this.sessionService.SuperAdmin
    ) {
      console.error('Access Center is blank in Users. Please contact your Administrator.');
      return EMPTY;
    }

    return next.handle(requestWithToken).pipe(
      map((event) => this.sanitizeUserDirectoryResponse(event, requestWithToken.url)),
      catchError((error: unknown) => {
        if (this.isUnauthorized(error)) {
          this.sessionService.logout('unauthorized');
        }

        return throwError(() => error);
      })
    );
  }

  private isUnauthorized(error: unknown): boolean {
    return Boolean(error && typeof error === 'object' && 'status' in error && error.status === 401);
  }

  private sanitizeUserDirectoryResponse(event: HttpEvent<unknown>, url: string): HttpEvent<unknown> {
    if (!(event instanceof HttpResponse)) {
      return event;
    }

    if (!url.includes('/users')) {
      return event;
    }

    const body = event.body;
    if (!body || typeof body !== 'object') {
      return event;
    }

    const clonedBody = this.removePasswordHash(body as Record<string, unknown>);
    return event.clone({ body: clonedBody });
  }

  private removePasswordHash(payload: Record<string, unknown>): Record<string, unknown> {
    const cloneRecord = (record: Record<string, unknown>): Record<string, unknown> => {
      const next: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(record)) {
        if (key === 'passwordHash') {
          continue;
        }

        if (Array.isArray(value)) {
          next[key] = value.map((item) =>
            item && typeof item === 'object' ? cloneRecord(item as Record<string, unknown>) : item
          );
          continue;
        }

        if (value && typeof value === 'object') {
          next[key] = cloneRecord(value as Record<string, unknown>);
          continue;
        }

        next[key] = value;
      }

      return next;
    };

    return cloneRecord(payload);
  }
}
