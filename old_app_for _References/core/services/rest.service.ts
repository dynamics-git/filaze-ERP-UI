import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';
import { AddItemService } from './shared/add-item.service';
import { UnifiedDialogService } from './shared/unified-dialog.service';

export interface RestRequestOptions {
  suppressGlobalErrorDialog?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RestService {
  private apiUrl: string = environment.api;

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private sessionService: SessionService,
    private toastr: ToastrService,
    private addItemService: AddItemService,
    private dialogService: UnifiedDialogService
  ) { }

  get getAuthorizationToken(): string {
    if (environment.authorizationType === 'Bearer') {
      return `${environment.authorizationType} ${localStorage.getItem('access-token')}`;
    }

    return `${environment.authorizationType} ${btoa(
      environment.username + ':' + environment.password
    )}`;
  }

  get httpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: this.getAuthorizationToken,
      }),
    };
  }

  get httpDownloadFileOptions() {
    return {
      headers: new HttpHeaders({
        Authorization: this.getAuthorizationToken,
      }),
      responseType: 'blob' as 'json',
    };
  }

  get httpLicenseCheckOptions() {
    return {
      headers: new HttpHeaders({
        apiKey: environment.licenseCheckToken,
      }),
    };
  }

  patchHttpOptions(ifMatchKey: string) {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: this.getAuthorizationToken,
        'If-Match': ifMatchKey,
      }),
    };
  }

  getApiUrl(endpoint: string): string {
    if (endpoint.includes('/companies')) {
      return this.apiUrl + endpoint;
    }

    return this.apiUrl + '/companies(' + this.sessionService.Company + ')' + endpoint;
  }

  public get(endpoint: string, options?: RestRequestOptions) {
    return this.httpClient
      .get(this.getApiUrl(endpoint), this.httpOptions)
      .pipe(catchError(this.handleError.bind(this, options)));
  }

  public post(endpoint: string, body: any, options?: RestRequestOptions) {
    if (body && typeof body === 'object') {
      delete body['index'];
    }

    return this.httpClient
      .post(this.getApiUrl(endpoint), body, this.httpOptions)
      .pipe(catchError(this.handleError.bind(this, options)));
  }

  public put(endpoint: string, body: any, options?: RestRequestOptions) {
    if (body && typeof body === 'object') {
      delete body['index'];
    }

    return this.httpClient
      .put(this.getApiUrl(endpoint), body, this.httpOptions)
      .pipe(catchError(this.handleError.bind(this, options)));
  }

  public patch(endpoint: string, body: any, ifMatchKey: string, options?: RestRequestOptions) {
    if (body && typeof body === 'object') {
      delete body['index'];
    }

    return this.httpClient
      .patch(this.getApiUrl(endpoint), body, this.patchHttpOptions(ifMatchKey))
      .pipe(catchError(this.handleError.bind(this, options)));
  }

  private getAccessToken(): string {
    return localStorage.getItem('access-token') || '';
  }

  patchBinary(endpoint: string, file: File): Observable<any> {
    return this.httpClient.patch(this.getApiUrl(endpoint), file, {
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${this.getAccessToken()}`,
        'If-Match': '*',
      },
      responseType: 'text' as 'json',
    });
  }
  
  deleteBinary(endpoint: string): Observable<any> {
    return this.httpClient.patch(this.getApiUrl(endpoint), "", {
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${this.getAccessToken()}`,
        'If-Match': '*',
      },
      responseType: 'text' as 'json',
    });
  }

  getBinary(endpoint: string): Observable<Blob> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });

    return this.httpClient.get(endpoint, {
      headers,
      responseType: 'blob',
    });
  }

  public delete(endpoint: string, options?: RestRequestOptions) {
    return this.httpClient
      .delete(this.getApiUrl(endpoint), this.httpOptions)
      .pipe(catchError(this.handleError.bind(this, options)));
  }

  public downloadFile(endpoint: string) {
    const url =
      'https://api.businesscentral.dynamics.com/v2.0/cenergi-sea.com/CenergiSEA-Sandbox/api/v1.0/companies(44b797d9-eced-eb11-a1de-0022485575d1)/salesInvoices(71cc69fb-e506-ec11-86bc-000d3ac8b198)/pdfDocument(71cc69fb-e506-ec11-86bc-000d3ac8b198)/content';

    return this.httpClient.get(url, this.httpDownloadFileOptions);
  }

  public notify(body: any) {
    return this.httpClient.post(`${environment.externalApi}ApprovalReviewRequest`, body, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        key: environment.externalApiKey,
      }),
    });
  }

  public Approvednotify(body: any) {
    return this.httpClient.post(`${environment.externalApi}Approved/Notify`, body, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        key: environment.externalApiKey,
      }),
    });
  }

  public VendorAcceptance(body: any) {
    return this.httpClient.post(`${environment.externalApi}VendorAcceptenceEmail`, body, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        key: environment.externalApiKey,
      }),
    });
  }

  public FinalApprovednotify(body: any) {
    return this.httpClient.post(`${environment.externalApi}FinalApprovalEmail`, body, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        key: environment.externalApiKey,
      }),
    });
  }

  public fileUpload(file: File) {
    const formData = new FormData();

    if (this.sessionService.Company) {
      formData.append(
        'file_name',
        `${this.sessionService.Company}_${file.name.split('.')[0]}_${new Date().getTime()}`
      );
    } else {
      formData.append('file_name', `${file.name.split('.')[0]}_${new Date().getTime()}`);
    }

    formData.append('file', file);

    return this.httpClient.post(`${environment.externalApi}DocumentUpload`, formData, {
      headers: new HttpHeaders({
        key: environment.externalApiKey,
      }),
    });
  }

  public deleteFile(fileUrl: string) {
    const formData = new FormData();
    formData.append('_method', 'delete');
    formData.append('file', fileUrl);

    return this.httpClient.post(`${environment.externalApi}DocumentDelete`, formData, {
      headers: new HttpHeaders({
        key: environment.externalApiKey,
      }),
    });
  }

  public getOAuth2Token() {
    return this.httpClient.get(`${environment.oauthTokenApi}Auth/Token`);
  }

  private handleError(options: RestRequestOptions | undefined, error: HttpErrorResponse): Observable<never> {
    this.addItemService.showLoader$.next(false);

    if (error.status === 0) {
      console.error('An error occurred:', error.error);
    } else if (error.status === 401) {
      this.sessionService.logout('unauthorized');
    } else if (error.status === 400 || error.status === 500) {
      const bcMessage =
        error?.error?.error?.message ||
        error?.message ||
        'Something went wrong! Please press F5 or click retry button to reload the page.';

      const cleanMessage = bcMessage.split('CorrelationId')[0].trim();

      if (!options?.suppressGlobalErrorDialog) {
        this.dialogService.openUiError(cleanMessage);
      }
    } else {
      // Always log the real HTTP status code and a clear message
      const statusCode = error.status;
      let backendStatus = error?.error?.status;
      let backendMessage = error?.error?.error?.message || error?.error?.message || error?.message || '';
      if (!backendStatus) backendStatus = statusCode;
      if (!backendMessage) backendMessage = JSON.stringify(error.error);
      console.error(
        `Backend returned HTTP status ${statusCode} (backend status: ${backendStatus}): ${backendMessage}`,
        error.error
      );
    }

    return throwError(() => error.error);
  }
}