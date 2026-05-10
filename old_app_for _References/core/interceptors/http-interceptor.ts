// // Angular
// import { Injectable } from '@angular/core';
// import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpClient, HttpHeaders } from '@angular/common/http';
// import { Router } from '@angular/router';

// import { EMPTY, Observable } from 'rxjs';
// import { tap } from 'rxjs/operators';
// import { ToastrService } from 'ngx-toastr';
// import { CookieService } from 'ngx-cookie-service';
// import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

// import { environment } from '../../../environments/environment';
// import { SessionService } from '../services/session.service';
// import { AddItemService } from '../services/shared/add-item.service';
// import { ApiErrorModalComponent } from '../../shared/components/api-error-modal/api-error-modal.component';


// @Injectable()
// export class InterceptService implements HttpInterceptor {
//     private apiUrl: string = environment.api;
//     IP: any;
//     checkLis: boolean = false;

//     constructor(private router: Router,
//         private modalService: NgbModal,
//         private toastr: ToastrService,
//         private sessionService: SessionService,
//         private addItemService: AddItemService,
//         private httpclient: HttpClient,
//         public activeModal: NgbActiveModal,
//         private cookie: CookieService) { }

//     intercept(
//         request: HttpRequest<any>,
//         next: HttpHandler
//     ): Observable<HttpEvent<any>> {

//         if (request.url.includes('Microsoft.NAV')) {

//             if (this.sessionService.DefaultResponsibilityCenter || this.sessionService.SuperAdmin) {
//                 return next.handle(request).pipe(
//                     tap(
//                         event => {
//                             // this.addItemService.showLoader$.next(false);          
//                             if (event instanceof HttpResponse) {
//                                 if (event.url != environment.lisenceApiCore + 'CheckSessionValidity' && event.url != environment.lisenceApiCore + 'CheckLoginPermission') {
//                                     if (this.sessionService.UserLiseceLoginIfo) {
//                                         if (!this.IP) {
//                                             this.getIpCliente();
//                                         }
//                                         else {
//                                             if (this.sessionService.User && this.sessionService.Email) {
//                                                 this.licensecheck();
//                                             }
//                                         }
//                                     }
//                                 }
//                                 // }
//                             }
//                         },
//                         error => {
//                             this.addItemService.showLoader$.next(false);
//                             if (error.status && error.status === 401) {
//                                 localStorage.removeItem('cenergi-user-details');
//                                 localStorage.removeItem('cenergi-comapny');
//                                 localStorage.removeItem('cenergi-comapny-name');
//                                 localStorage.removeItem('cenergi-responsibility-center');
//                                 localStorage.removeItem('cenergi-responsibility-centers');
//                                 localStorage.removeItem('cenergi-super-admin');
//                                 localStorage.removeItem('cenergi-show-res-center-selection');
//                                 localStorage.removeItem('cenergi-show-all-res-centers');
//                                 localStorage.removeItem('cenergi-default-responsibility-center');
//                                 localStorage.removeItem('cenergi-licensePermission');
//                                 localStorage.removeItem('cenergi-user-ip');
//                                 localStorage.removeItem('cenergi-Lisence-details');
//                                 localStorage.removeItem('access-token');
//                                 this.router.navigate(['/auth/login']);
//                             } else if (error.status && (error.status === 400 || error.status === 500)) {
//                                 if (request.method !== 'GET') {
//                                     this.toastr.error(error.error.error.message);
//                                 }

//                                 this.modalService.open(ApiErrorModalComponent, { backdrop: 'static' });
//                             }
//                             // if (error.status && error.status === 503) {
//                             //   localStorage.removeItem('token');
//                             //   localStorage.removeItem('username');
//                             //   // this.toastr.error('Application is temporarily unavailable');
//                             //   this.router.navigate(['/auth/errorPage']);
//                             // }
//                             // else{

//                             // }
//                         }
//                     )
//                 );

//             }
//             else {
//                 this.toastr.error('Responsibility Center is blank in Users. Please contact your Administrator.');
//                 this.addItemService.showLoader$.next(false);
//                 return EMPTY;

//             }
//         }
//         else {
//             return next.handle(request).pipe(
//                 tap(
//                     event => {
//                         // this.addItemService.showLoader$.next(false);          
//                         if (event instanceof HttpResponse) {
//                             if (event.url != environment.lisenceApiCore + 'CheckSessionValidity' && event.url != environment.lisenceApiCore + 'CheckLoginPermission') {
//                                 if (this.sessionService.UserLiseceLoginIfo) {
//                                     if (!this.IP) {
//                                         this.getIpCliente();
//                                     }
//                                     else {
//                                         if (this.sessionService.User && this.sessionService.Email) {
//                                             this.licensecheck();
//                                         }
//                                     }
//                                 }
//                             }
//                             // }
//                         }
//                     },
//                     error => {
//                         this.addItemService.showLoader$.next(false);
//                         if (error.status && error.status === 401) {
//                             localStorage.removeItem('cenergi-user-details');
//                             localStorage.removeItem('cenergi-comapny');
//                             localStorage.removeItem('cenergi-comapny-name');
//                             localStorage.removeItem('cenergi-responsibility-center');
//                             localStorage.removeItem('cenergi-responsibility-centers');
//                             localStorage.removeItem('cenergi-super-admin');
//                             localStorage.removeItem('cenergi-show-res-center-selection');
//                             localStorage.removeItem('cenergi-show-all-res-centers');
//                             localStorage.removeItem('cenergi-default-responsibility-center');
//                             localStorage.removeItem('cenergi-licensePermission');
//                             localStorage.removeItem('cenergi-user-ip');
//                             localStorage.removeItem('cenergi-Lisence-details');
//                             localStorage.removeItem('access-token');
//                             this.router.navigate(['/auth/login']);
//                         } else if (error.status && (error.status === 400 || error.status === 500)) {
//                             if (request.method !== 'GET') {
//                                 this.toastr.error(error.error.error.message);
//                             }

//                             this.modalService.open(ApiErrorModalComponent, { backdrop: 'static' });
//                         }
//                         // if (error.status && error.status === 503) {
//                         //   localStorage.removeItem('token');
//                         //   localStorage.removeItem('username');
//                         //   // this.toastr.error('Application is temporarily unavailable');
//                         //   this.router.navigate(['/auth/errorPage']);
//                         // }
//                         // else{

//                         // }
//                     }
//                 )
//             );
//         }
//     }


//     logOut() {
//         let username = this.sessionService.UserName;
//         let token_cookie = this.cookie.get("token");
//         this.httpclient.get(this.apiUrl + '/Users/Logout?email=' + username + '&token=' + token_cookie).subscribe((datalogout: any) => {
//             this.cookie.set("cenergi-user-details", '');
//             this.cookie.set("access-token", '');
//             this.router.navigate(['/auth/login']);
//         });
//     }

//     getIpCliente() {
//         if (this.activeModal.close.length) {
//             this.activeModal.close();
//         }
//         // this.httpclient.get("http://api.ipify.org/?format=json").subscribe((response: any) => { 
//         //   this.IP = response.ip;
//         //   this.sessionService.IP = this.IP;
//         //   console.log(this.IP);
//         // console.log(this.sessionService.User);
//         if (this.sessionService.User && this.sessionService.Email) {
//             this.licensecheck();
//         }
//         // })
//     }


//     get httpOptions() {
//         return {
//             headers: new HttpHeaders(
//                 {
//                     'apiKey': environment.licenseCheckToken,
//                 })
//         };
//     }
//     licensecheck() {
//         let payload = this.sessionService.UserLiseceLoginIfo;

//         this.httpclient.post(environment.lisenceApiCore + 'CheckSessionValidity', payload, this.httpOptions).subscribe((response: any) => {
//             if (response) {
//                 if (response && response.PassToLogin) {
//                     this.checkLis = true;
//                     this.sessionService.licensePermission = true;
//                 } else {
//                     this.toastr.error(response.Message);
//                     this.logOutforLicense();
//                     this.checkLis = true;
//                     this.sessionService.licensePermission = false;
//                 }
//             }
//         }, error => {
//             this.toastr.error('something went wrong pres f5');
//             this.checkLis = true;
//         });
//     }

//     logOutforLicense() {
//         localStorage.removeItem('cenergi-user-details');
//         localStorage.removeItem('cenergi-comapny');
//         localStorage.removeItem('cenergi-comapny-name');
//         localStorage.removeItem('cenergi-responsibility-center');
//         localStorage.removeItem('cenergi-responsibility-centers');
//         localStorage.removeItem('cenergi-super-admin');
//         localStorage.removeItem('cenergi-show-res-center-selection');
//         localStorage.removeItem('cenergi-show-all-res-centers');
//         localStorage.removeItem('cenergi-default-responsibility-center');
//         localStorage.removeItem('cenergi-licensePermission');
//         localStorage.removeItem('cenergi-user-ip');
//         localStorage.removeItem('cenergi-Lisence-details');
//         window.location.href = window.location.origin + '/#/auth/login';
//     }

// }
//improved code with idle session logout feature
// Angular


// import { Injectable } from '@angular/core';
// import {
//     HttpEvent,
//     HttpInterceptor,
//     HttpHandler,
//     HttpRequest,
//     HttpResponse,
//     HttpClient,
//     HttpHeaders
// } from '@angular/common/http';
// import { Router } from '@angular/router';

// // import { EMPTY, Observable } from 'rxjs';
// // import { tap } from 'rxjs/operators';
// import { EMPTY, Observable } from 'rxjs';
// import { tap, map } from 'rxjs/operators';

// import { ToastrService } from 'ngx-toastr';
// import { CookieService } from 'ngx-cookie-service';
// import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

// import { environment } from '../../../environments/environment';
// import { SessionService } from '../services/session.service';
// import { AddItemService } from '../services/shared/add-item.service';
// import { ApiErrorModalComponent } from '../../shared/components/api-error-modal/api-error-modal.component';
// import { UnicodeNormalizer } from '../utils/unicode-normalizer';

// @Injectable()
// export class InterceptService implements HttpInterceptor {

//     private apiUrl: string = environment.api;
//     IP: any;
//     checkLis: boolean = false;

//     // 🔑 STEP 2: allow ONE soft failure
//     private authFailureCount = 0;

//     constructor(
//         private router: Router,
//         private modalService: NgbModal,
//         private toastr: ToastrService,
//         private sessionService: SessionService,
//         private addItemService: AddItemService,
//         private httpclient: HttpClient,
//         public activeModal: NgbActiveModal,
//         private cookie: CookieService
//     ) { }

//     intercept(
//         request: HttpRequest<any>,
//         next: HttpHandler
//     ): Observable<HttpEvent<any>> {

//         const handleSuccess = (event: HttpEvent<any>): HttpEvent<any> => {

//             if (event instanceof HttpResponse) {

//                 // 🔑 reset failure count on ANY success
//                 this.authFailureCount = 0;

//                 // ✅ GLOBAL Unicode normalization
//                 if (event.body) {
//                     const normalizedBody = UnicodeNormalizer.normalize(event.body);
//                     event = event.clone({ body: normalizedBody });
//                 }

//                 // existing license logic (UNCHANGED)
//                 if (
//                     event.url !== environment.lisenceApiCore + 'CheckSessionValidity' &&
//                     event.url !== environment.lisenceApiCore + 'CheckLoginPermission'
//                 ) {
//                     if (this.sessionService.UserLiseceLoginIfo) {
//                         if (!this.IP) {
//                             this.getIpCliente();
//                         } else if (this.sessionService.User && this.sessionService.Email) {
//                             this.licensecheck();
//                         }
//                     }
//                 }
//             }

//             return event;
//         };



//         const handleError = (error: any, request: HttpRequest<any>) => {
//             this.addItemService.showLoader$.next(false);

//             // 🔴 STEP 2: soften 401
//             if (error.status === 401) {

//                 // FIRST 401 → warn only
//                 if (this.authFailureCount === 0) {
//                     this.authFailureCount++;

//                     this.toastr.warning(
//                         'Session issue detected. Please retry your action.',
//                         'Session Warning'
//                     );

//                     return EMPTY;
//                 }

//                 // SECOND 401 → real logout (existing behavior)
//                 this.clearSessionAndRedirect();
//                 return EMPTY;
//             }

//             if (error.status === 400 || error.status === 500) {
//                 if (request.method !== 'GET') {
//                     this.toastr.error(error.error?.error?.message || 'Server error');
//                 }
//                 this.modalService.open(ApiErrorModalComponent, { backdrop: 'static' });
//                 return EMPTY;
//             }

//             return EMPTY;
//         };

//         // ================= MAIN FLOW =================

//         if (request.url.includes('Microsoft.NAV')) {

//             if (this.sessionService.DefaultResponsibilityCenter || this.sessionService.SuperAdmin) {
//                 return next.handle(request).pipe(
//                     map(event => handleSuccess(event)),
//                     tap({
//                         error: (error) => handleError(error, request)
//                     })
//                 );

//             } else {
//                 this.toastr.error(
//                     'Responsibility Center is blank in Users. Please contact your Administrator.'
//                 );
//                 this.addItemService.showLoader$.next(false);
//                 return EMPTY;
//             }

//         } else {

//             return next.handle(request).pipe(
//                 map(event => handleSuccess(event)),
//                 tap({
//                     error: (error) => handleError(error, request)
//                 })
//             );

//         }
//     }

//     // ================= HELPERS =================

//     private clearSessionAndRedirect(): void {
//         localStorage.removeItem('cenergi-user-details');
//         localStorage.removeItem('cenergi-comapny');
//         localStorage.removeItem('cenergi-comapny-name');
//         localStorage.removeItem('cenergi-responsibility-center');
//         localStorage.removeItem('cenergi-responsibility-centers');
//         localStorage.removeItem('cenergi-super-admin');
//         localStorage.removeItem('cenergi-show-res-center-selection');
//         localStorage.removeItem('cenergi-show-all-res-centers');
//         localStorage.removeItem('cenergi-default-responsibility-center');
//         localStorage.removeItem('cenergi-licensePermission');
//         localStorage.removeItem('cenergi-user-ip');
//         localStorage.removeItem('cenergi-Lisence-details');
//         localStorage.removeItem('access-token');

//         this.router.navigate(['/auth/login']);
//     }

//     logOut() {
//         let username = this.sessionService.UserName;
//         let token_cookie = this.cookie.get('token');
//         this.httpclient
//             .get(this.apiUrl + '/Users/Logout?email=' + username + '&token=' + token_cookie)
//             .subscribe(() => {
//                 this.cookie.set('cenergi-user-details', '');
//                 this.cookie.set('access-token', '');
//                 this.router.navigate(['/auth/login']);
//             });
//     }

//     getIpCliente() {
//         if (this.activeModal.close.length) {
//             this.activeModal.close();
//         }

//         if (this.sessionService.User && this.sessionService.Email) {
//             this.licensecheck();
//         }
//     }

//     get httpOptions() {
//         return {
//             headers: new HttpHeaders({
//                 apiKey: environment.licenseCheckToken
//             })
//         };
//     }

//     licensecheck() {
//         let payload = this.sessionService.UserLiseceLoginIfo;

//         this.httpclient
//             .post(environment.lisenceApiCore + 'CheckSessionValidity', payload, this.httpOptions)
//             .subscribe(
//                 (response: any) => {
//                     if (response && response.PassToLogin) {
//                         this.checkLis = true;
//                         this.sessionService.licensePermission = true;
//                     } else {
//                         // 🔴 license failure = immediate logout (unchanged)
//                         this.toastr.error(response?.Message || 'License validation failed');
//                         this.logOutforLicense();
//                         this.checkLis = true;
//                         this.sessionService.licensePermission = false;
//                     }
//                 },
//                 () => {
//                     this.toastr.error('Something went wrong. Press F5.');
//                     this.checkLis = true;
//                 }
//             );
//     }

//     logOutforLicense() {
//         localStorage.removeItem('cenergi-user-details');
//         localStorage.removeItem('cenergi-comapny');
//         localStorage.removeItem('cenergi-comapny-name');
//         localStorage.removeItem('cenergi-responsibility-center');
//         localStorage.removeItem('cenergi-responsibility-centers');
//         localStorage.removeItem('cenergi-super-admin');
//         localStorage.removeItem('cenergi-show-res-center-selection');
//         localStorage.removeItem('cenergi-show-all-res-centers');
//         localStorage.removeItem('cenergi-default-responsibility-center');
//         localStorage.removeItem('cenergi-licensePermission');
//         localStorage.removeItem('cenergi-user-ip');
//         localStorage.removeItem('cenergi-Lisence-details');

//         window.location.href = window.location.origin + '/#/auth/login';
//     }
// }


//new

import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Observable, EMPTY, throwError } from 'rxjs';
import { tap, map } from 'rxjs/operators';

import { ToastrService } from 'ngx-toastr';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { environment } from '../../../environments/environment';
import { SessionService } from '../services/session.service';
import { AddItemService } from '../services/shared/add-item.service';
import { ApiErrorModalComponent } from '../../shared/components/api-error-modal/api-error-modal.component';
import { UnicodeNormalizer } from '../utils/unicode-normalizer';

@Injectable()
export class InterceptService implements HttpInterceptor {
  private apiUrl: string = environment.api;
  IP: any;
  checkLis: boolean = false;

  constructor(
    private modalService: NgbModal,
    private toastr: ToastrService,
    private sessionService: SessionService,
    private addItemService: AddItemService,
    private httpclient: HttpClient,
    public activeModal: NgbActiveModal
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const handleSuccess = (event: HttpEvent<any>): HttpEvent<any> => {
      if (event instanceof HttpResponse) {
        if (event.body) {
          const normalizedBody = UnicodeNormalizer.normalize(event.body);
          event = event.clone({ body: normalizedBody });
        }

        if (
          event.url !== environment.lisenceApiCore + 'CheckSessionValidity' &&
          event.url !== environment.lisenceApiCore + 'CheckLoginPermission'
        ) {
          if (this.sessionService.UserLiseceLoginIfo) {
            if (!this.IP) {
              this.getIpCliente();
            } else if (this.sessionService.User && this.sessionService.Email) {
              this.licensecheck();
            }
          }
        }
      }

      return event;
    };

    const handleError = (error: any, currentRequest: HttpRequest<any>) => {
      this.addItemService.showLoader$.next(false);

      if (error?.status === 401) {
        this.sessionService.logout('unauthorized');
        return EMPTY;
      }

      // Let the error propagate — RestService.handleError shows UiErrorModalComponent
      // with a Dismiss button (no page reload). Opening a modal here would cause a
      // second modal to stack on top of it.
      return throwError(() => error);
    };

    if (request.url.includes('Microsoft.NAV')) {
      if (
        this.sessionService.DefaultResponsibilityCenter ||
        this.sessionService.SuperAdmin
      ) {
        return next.handle(request).pipe(
          map((event) => handleSuccess(event)),
          tap({
            error: (error) => handleError(error, request)
          })
        );
      } else {
        this.toastr.error(
          'Responsibility Center is blank in Users. Please contact your Administrator.'
        );
        this.addItemService.showLoader$.next(false);
        return EMPTY;
      }
    }

    return next.handle(request).pipe(
      map((event) => handleSuccess(event)),
      tap({
        error: (error) => handleError(error, request)
      })
    );
  }

  getIpCliente() {
    if (this.activeModal.close.length) {
      this.activeModal.close();
    }

    if (this.sessionService.User && this.sessionService.Email) {
      this.licensecheck();
    }
  }

  get httpOptions() {
    return {
      headers: new HttpHeaders({
        apiKey: environment.licenseCheckToken
      })
    };
  }

  licensecheck() {
    const payload = this.sessionService.UserLiseceLoginIfo;

    this.httpclient
      .post(
        environment.lisenceApiCore + 'CheckSessionValidity',
        payload,
        this.httpOptions
      )
      .subscribe(
        (response: any) => {
          if (response && response.PassToLogin) {
            this.checkLis = true;
            this.sessionService.licensePermission = true;
          } else {
            this.toastr.error(response?.Message || 'License validation failed');
            this.checkLis = true;
            this.sessionService.licensePermission = false;
            this.sessionService.logout('license');
          }
        },
        () => {
          this.toastr.error('Something went wrong. Press F5.');
          this.checkLis = true;
        }
      );
  }
}