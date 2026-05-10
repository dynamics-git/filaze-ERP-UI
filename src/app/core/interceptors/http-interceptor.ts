import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, EMPTY, Observable, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {
  constructor(private readonly sessionService: SessionService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (
      request.url.includes('Microsoft.NAV') &&
      !this.sessionService.DefaultResponsibilityCenter &&
      !this.sessionService.SuperAdmin
    ) {
      console.error('Responsibility Center is blank in Users. Please contact your Administrator.');
      return EMPTY;
    }

    return next.handle(request).pipe(
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
}
