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
    const filter = `?$filter=email eq '${this.escapeODataString(email)}'`;
    return this.restService.get(`/companies(${company})/portalUsers${filter}`);
  }

  getUserDeatils(company: string, email: string): Observable<unknown> {
    return this.getUserDetails(company, email);
  }

  getUserRoleDetails(roleId: string): Observable<unknown> {
    return this.restService.get(`/portalUsersRoles?$filter=roleId eq '${this.escapeODataString(roleId)}'`);
  }

  getUserResponsibilityCenterPermission(userId: string, companyId: string): Observable<unknown> {
    const filter = `?$filter=userId eq '${this.escapeODataString(userId)}'`;
    return this.restService.get(`/companies(${companyId})/portalResponsibilityPermissions${filter}`);
  }

  getUserCompanyPermission(userId: string, companyId: string): Observable<unknown> {
    const filter = `?$filter=userId eq '${this.escapeODataString(userId)}'`;
    return this.restService.get(`/companies(${companyId})/portalCompanyPermissions${filter}`);
  }

  getRolePermissions(roleId: string): Observable<unknown> {
    return this.restService.get(`/portalPermissions?$filter=roleId eq '${this.escapeODataString(roleId)}'`);
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
        defaultResponsibilityCenter: this.readFirstString(user, ['defaultResponsibilityCentre', 'DefaultResponsibilityCentre'])
      });

      return of({ user, session });
    }

    return this.getUserCompanyPermission(this.readUserId(user), request.companyId).pipe(
      switchMap((companyPermissionResponse) => {
        const companyPermissions = this.records(companyPermissionResponse);
        const hasCompanyPermission = companyPermissions.some((item) => {
          const permission = item as Record<string, unknown>;
          return this.readBoolean(permission, 'accessAllCompany') || this.readFirstString(permission, ['companyId', 'CompanyId']) === request.companyId;
        });

        if (!hasCompanyPermission) {
          return throwError(() => new Error("User does not have permission to selected company."));
        }

        return this.getUserRoleDetails(this.readRoleId(user)).pipe(
          switchMap((roleResponse) => {
            const role = this.firstRecord(roleResponse);

            if (role && this.readBoolean(role, 'isSuperAdmin')) {
              const session = this.createSessionContext(user, request, {
                superAdmin: true,
                permissions: [],
                responsibilityCenters: [],
                responsibilityCenter: undefined,
                defaultResponsibilityCenter: this.readFirstString(user, ['defaultResponsibilityCentre', 'DefaultResponsibilityCentre'])
              });

              return of({ user, session });
            }

            return this.resolveResponsibilityContext(user, request).pipe(
              switchMap((result) => this.getRolePermissions(this.readRoleId(user)).pipe(
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
    return this.getUserResponsibilityCenterPermission(this.readUserId(user), request.companyId).pipe(
      map((response) => {
        const responsibilityPermissions = this.records(response)
          .filter((item) => {
            const permission = item as Record<string, unknown>;
            return this.readBoolean(permission, 'accessAllCompany') || this.readFirstString(permission, ['companyId', 'CompanyId']) === request.companyId;
          });

        if (!responsibilityPermissions.length) {
          throw new Error('User is not configured with any Responsibility Center.');
        }

        const accessAllResCenters = responsibilityPermissions.some((item) => this.readBoolean(item as Record<string, unknown>, 'accessAllResCentre'));
        const defaultResponsibilityCenter = this.readFirstString(user, ['defaultResponsibilityCentre', 'DefaultResponsibilityCentre']) || this.extractResponsibilityCenterCode(responsibilityPermissions[0]);
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
    const storedPassword = this.readFirstString(user, ['password', 'Password']);
    const passwordHash = this.readFirstString(user, ['passwordHash', 'PasswordHash']);

    if (storedPassword) {
      return storedPassword === password;
    }

    return Boolean(passwordHash && this.credentialService.matchesPassword(passwordHash, password));
  }

  private isAdminUser(user: Record<string, unknown>): boolean {
    return this.readFirstString(user, ['userName', 'UserName', 'email', 'Email']).toLowerCase() === 'admin@tecsa.com.my';
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
    const value = this.readValue(source, key);
    return value === undefined || value === null ? '' : String(value);
  }

  private readFirstString(source: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = this.readString(source, key);
      if (value.length) {
        return value;
      }
    }

    return '';
  }

  private readUserId(user: Record<string, unknown>): string {
    return this.readFirstString(user, ['userId', 'UserId', 'systemId', 'SystemId', 'id', 'Id']);
  }

  private readRoleId(user: Record<string, unknown>): string {
    return this.readFirstString(user, ['roleId', 'RoleId']);
  }

  private readBoolean(source: Record<string, unknown>, key: string): boolean {
    const value = this.readValue(source, key);
    return value === true || value === 'true' || value === 'True' || value === 'Yes' || value === '1';
  }

  private readValue(source: Record<string, unknown>, key: string): unknown {
    if (key in source) {
      return source[key];
    }

    const normalized = key.toLowerCase();
    const matched = Object.keys(source).find((candidate) => candidate.toLowerCase() === normalized);
    return matched ? source[matched] : undefined;
  }

  private escapeODataString(value: string): string {
    return value.replace(/'/g, "''");
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
      const result = this.readFirstString(record, [
        'portalResponsibilityCentre',
        'PortalResponsibilityCentre',
        'responsibilityCentre',
        'ResponsibilityCentre',
        'responsibilityCenter',
        'ResponsibilityCenter',
        'code',
        'Code',
        'id',
        'Id'
      ]);
      return result === undefined || result === null ? '' : String(result);
    }

    return '';
  }

}
