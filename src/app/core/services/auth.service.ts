import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiAuthService } from './api-auth.service';
import { CredentialService } from './credential.service';
import { RestService } from './rest.service';
import { SessionContext, SessionService } from './session.service';

export type LoginRequest = {
  companyId: string;
  companyName?: string;
  email: string;
  password: string;
};

export type LoginResult = {
  user: Record<string, unknown>;
  session: SessionContext;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private readonly apiAuth: ApiAuthService,
    private readonly restService: RestService,
    private readonly sessionService: SessionService,
    private readonly http: HttpClient,
    private readonly credentialService: CredentialService
  ) {}

  authenticate(): Observable<string> {
    if (this.sessionService.AccessToken) {
      return of(this.sessionService.AccessToken);
    }

    return this.apiAuth.getToken().pipe(
      tap((token) => {
        this.sessionService.AccessToken = token;
      })
    );
  }

  storeAccessToken(token: string): void {
    this.sessionService.AccessToken = token;
  }

  applySessionContext(context: SessionContext): void {
    this.sessionService.applySessionContext(context);
  }

  getCompanies(): Observable<unknown> {
    return this.restService.get('/companies');
  }

  getUserDetails(company: string, email: string): Observable<unknown> {
    const filter = `?$filter=Email eq '${email}'`;
    return this.restService.get(`/companies(${company})/portalUsers${filter}`);
  }

  getUserDeatils(company: string, email: string): Observable<unknown> {
    return this.getUserDetails(company, email);
  }

  getUserRoleDetails(roleId: string): Observable<unknown> {
    return this.restService.get(`/portalUsersRoles?$filter=RoleId eq '${roleId}'`);
  }

  getUserResponsibilityCenterPermission(userId: string, companyId: string): Observable<unknown> {
    const filter = `?$filter=UserId eq '${userId}'`;
    return this.restService.get(`/companies(${companyId})/portalResponsibilityPermissions${filter}`);
  }

  getUserCompanyPermission(userId: string, companyId: string): Observable<unknown> {
    const filter = `?$filter=UserId eq '${userId}'`;
    return this.restService.get(`/companies(${companyId})/portalCompanyPermissions${filter}`);
  }

  getRolePermissions(roleId: string): Observable<unknown> {
    return this.restService.get(`/portalPermissions?$filter=RoleId eq '${roleId}'`);
  }

  login(request: LoginRequest): Observable<LoginResult> {
    return this.authenticate().pipe(
      switchMap(() => this.getUserDetails(request.companyId, request.email)),
      switchMap((response) => {
        const user = this.firstRecord(response);

        if (!user) {
          return throwError(() => new Error('Email is not registered.'));
        }

        if (!this.isPasswordValid(user, request.password)) {
          return throwError(() => new Error('Password is incorrect.'));
        }

        return this.resolveSessionContext(user, request);
      }),
      tap(({ session }) => {
        this.sessionService.applySessionContext(session);
      })
    );
  }

  checkLoginPermission(userEmail: string, macId: string): Observable<unknown> {
    if (!environment.licenseApi || !environment.licenseCheckToken) {
      return of({ PassToLogin: true });
    }

    return this.http.post(environment.licenseApi, {
      UserEmail: userEmail,
      MacId: macId
    }, {
      headers: new HttpHeaders({
        apiKey: environment.licenseCheckToken
      })
    });
  }

  transferLogin(userEmail: string, macId: string): Observable<unknown> {
    if (!environment.lisenceApiCore || !environment.licenseCheckToken) {
      return of({});
    }

    return this.http.post(`${environment.lisenceApiCore}TransferLogin`, {
      UserEmail: userEmail,
      MacId: macId
    }, {
      headers: new HttpHeaders({
        apiKey: environment.licenseCheckToken
      })
    });
  }

  isSuperAdmin(): boolean {
    return this.sessionService.SuperAdmin;
  }

  hasPermission(pageName: string, permission: 'read' | 'insert' | 'modify' | 'post' | 'delete'): boolean {
    return this.sessionService.hasPermission(pageName, permission);
  }

  logout(reason?: string): void {
    this.sessionService.logout(reason);
  }

  private resolveSessionContext(user: Record<string, unknown>, request: LoginRequest): Observable<LoginResult> {
    if (this.isAdminUser(user)) {
      const session = this.createSessionContext(user, request, {
        superAdmin: true,
        responsibilityCenters: [],
        responsibilityCenter: undefined,
        defaultResponsibilityCenter: this.readString(user, 'DefaultResponsibilityCentre')
      });

      return of({ user, session });
    }

    return this.getUserCompanyPermission(this.readString(user, 'UserId'), request.companyId).pipe(
      switchMap((companyPermissionResponse) => {
        const companyPermissions = this.records(companyPermissionResponse);
        const hasCompanyPermission = companyPermissions.some((item) => {
          const permission = item as Record<string, unknown>;
          return Boolean(permission['AccessAllCompany']) || permission['CompanyId'] === request.companyId;
        });

        if (!hasCompanyPermission) {
          return throwError(() => new Error("User does not have permission to selected company."));
        }

        return this.getUserRoleDetails(this.readString(user, 'RoleId')).pipe(
          switchMap((roleResponse) => {
            const role = this.firstRecord(roleResponse);

            if (role && Boolean(role['IsSuperAdmin'])) {
              const session = this.createSessionContext(user, request, {
                superAdmin: true,
                permissions: [],
                responsibilityCenters: [],
                responsibilityCenter: undefined,
                defaultResponsibilityCenter: this.readString(user, 'DefaultResponsibilityCentre')
              });

              return of({ user, session });
            }

            return this.resolveResponsibilityContext(user, request).pipe(
              switchMap((result) => this.getRolePermissions(this.readString(user, 'RoleId')).pipe(
                map((permissionsResponse) => ({
                  ...result,
                  session: {
                    ...result.session,
                    permissions: this.records(permissionsResponse)
                  }
                }))
              ))
            );
          })
        );
      })
    );
  }

  private resolveResponsibilityContext(user: Record<string, unknown>, request: LoginRequest): Observable<LoginResult> {
    return this.getUserResponsibilityCenterPermission(this.readString(user, 'UserId'), request.companyId).pipe(
      map((response) => {
        const responsibilityPermissions = this.records(response)
          .filter((item) => {
            const permission = item as Record<string, unknown>;
            return Boolean(permission['AccessAllCompany']) || permission['CompanyId'] === request.companyId;
          });

        if (!responsibilityPermissions.length) {
          throw new Error('User is not configured with any Responsibility Center.');
        }

        const accessAllResCenters = responsibilityPermissions.some((item) => Boolean((item as Record<string, unknown>)['AccessAllResCentre']));
        const defaultResponsibilityCenter = this.readString(user, 'DefaultResponsibilityCentre') || this.extractResponsibilityCenterCode(responsibilityPermissions[0]);
        const session = this.createSessionContext(user, request, {
          superAdmin: false,
          showAllResCenters: accessAllResCenters,
          showResCenterSelection: true,
          responsibilityCenters: responsibilityPermissions,
          responsibilityCenter: accessAllResCenters ? undefined : defaultResponsibilityCenter,
          defaultResponsibilityCenter
        });

        return { user, session };
      })
    );
  }

  private createSessionContext(
    user: Record<string, unknown>,
    request: LoginRequest,
    overrides: Partial<SessionContext>
  ): SessionContext {
    return {
      user,
      company: request.companyId,
      companyName: request.companyName,
      accessToken: this.sessionService.AccessToken,
      ...overrides
    };
  }

  private isPasswordValid(user: Record<string, unknown>, password: string): boolean {
    const storedPassword = this.readString(user, 'Password');
    const passwordHash = this.readString(user, 'PasswordHash');

    if (storedPassword) {
      return storedPassword === password;
    }

    return Boolean(passwordHash && this.credentialService.matchesPassword(passwordHash, password));
  }

  private isAdminUser(user: Record<string, unknown>): boolean {
    return this.readString(user, 'UserName').toLowerCase() === 'admin@tecsa.com.my';
  }

  private firstRecord(response: unknown): Record<string, unknown> | undefined {
    return this.records(response)[0] as Record<string, unknown> | undefined;
  }

  private records(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === 'object' && 'value' in response) {
      const value = (response as Record<string, unknown>)['value'];
      return Array.isArray(value) ? value : [];
    }

    return [];
  }

  private readString(source: Record<string, unknown>, key: string): string {
    const value = source[key];
    return value === undefined || value === null ? '' : String(value);
  }

  private extractResponsibilityCenterCode(value: unknown): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const result = record['PortalResponsibilityCentre'] || record['ResponsibilityCentre'] || record['ResponsibilityCenter'] || record['Code'] || record['code'] || record['Id'] || record['id'];
      return result === undefined || result === null ? '' : String(result);
    }

    return '';
  }

}
