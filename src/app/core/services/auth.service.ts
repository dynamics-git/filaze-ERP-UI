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

type BackendLoginResponse = Record<string, unknown>;

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
    return this.restService.get(`/companies(${company})/users${filter}`);
  }

  getUserDeatils(company: string, email: string): Observable<unknown> {
    return this.getUserDetails(company, email);
  }

  getUserRoleDetails(roleId: string): Observable<unknown> {
    return this.restService.get(`/userRoles?$filter=roleId eq '${this.escapeODataString(roleId)}'`);
  }

  getUserAccessCenterPermission(userId: string, companyId: string): Observable<unknown> {
    const filter = `?$filter=userId eq '${this.escapeODataString(userId)}'`;
    return this.restService.get(`/companies(${companyId})/accessCenterPermissions${filter}`);
  }

  getUserCompanyPermission(userId: string, companyId: string): Observable<unknown> {
    const filter = `?$filter=userId eq '${this.escapeODataString(userId)}'`;
    return this.restService.get(`/companies(${companyId})/companyAccessPermissions${filter}`);
  }

  getRolePermissions(roleId: string): Observable<unknown> {
    return this.restService.get(`/accessPermissions?$filter=roleId eq '${this.escapeODataString(roleId)}'`);
  }

  login(request: LoginRequest): Observable<LoginResult> {
    return this.http.post<BackendLoginResponse>(this.buildAuthUrl('/auth/login'), {
      login: request.email.trim(),
      password: request.password,
      deviceName: this.getDeviceName()
    }).pipe(
      switchMap((response) => {
        const token = this.extractToken(response);

        if (!token) {
          return throwError(() => new Error('Login response did not include an access token.'));
        }

        this.sessionService.AccessToken = token;
        const responseUser = this.extractUser(response);

        return this.getCurrentUser().pipe(
          map((meUser) => responseUser ?? meUser),
          map((user) => ({
            user,
            session: this.createSessionContext(user, request, {
              superAdmin: this.isAdminUser(user),
              permissions: [],
              accessCenters: [],
              accessCenter: undefined,
              defaultAccessCenter: this.readFirstString(user, ['defaultAccessCenter', 'DefaultAccessCenter'])
            })
          }))
        );
      }),
      tap(({ session }) => {
        this.sessionService.applySessionContext(session);
      })
    );
  }

  getCurrentUser(): Observable<Record<string, unknown>> {
    return this.http.get<BackendLoginResponse>(this.buildAuthUrl('/auth/me'), {
      headers: this.createBearerHeaders()
    }).pipe(
      map((response) => {
        const user = this.extractUser(response) ?? this.toRecord(response);

        if (!user) {
          throw new Error('Current user response did not include user details.');
        }

        return user;
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

  private buildAuthUrl(endpoint: string): string {
    const baseUrl = environment.authApiBaseUrl || environment.apiBaseUrl.replace(/\/tecsa\/procure\/v1\.0\/?$/i, '');
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${normalizedBase}${normalizedEndpoint}`;
  }

  private createBearerHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.sessionService.AccessToken}`
    });
  }

  private extractToken(response: unknown): string {
    const tokenKeys = ['token', 'access_token', 'accessToken', 'plainTextToken'];
    const queue: unknown[] = [response];

    while (queue.length) {
      const current = queue.shift();

      if (!current || typeof current !== 'object') {
        continue;
      }

      const record = current as Record<string, unknown>;

      for (const key of tokenKeys) {
        const value = this.readValue(record, key);
        if (typeof value === 'string' && value.trim().length) {
          return value.trim();
        }
      }

      for (const key of ['data', 'result', 'auth']) {
        const nested = this.readValue(record, key);
        if (nested && typeof nested === 'object') {
          queue.push(nested);
        }
      }
    }

    return '';
  }

  private extractUser(response: unknown): Record<string, unknown> | undefined {
    const record = this.toRecord(response);

    if (!record) {
      return undefined;
    }

    for (const key of ['user', 'User', 'profile', 'data']) {
      const value = this.readValue(record, key);
      const user = this.toRecord(value);

      if (user && !this.extractToken(user)) {
        return user;
      }

      if (user) {
        const nestedUser = this.extractUser(user);
        if (nestedUser) {
          return nestedUser;
        }
      }
    }

    return undefined;
  }

  private toRecord(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : undefined;
  }

  private getDeviceName(): string {
    if (typeof navigator === 'undefined') {
      return 'Filaz ERP';
    }

    return navigator.userAgent || 'Filaz ERP';
  }

  private resolveSessionContext(user: Record<string, unknown>, request: LoginRequest): Observable<LoginResult> {
    if (this.isAdminUser(user)) {
      const session = this.createSessionContext(user, request, {
        superAdmin: true,
        accessCenters: [],
        accessCenter: undefined,
        defaultAccessCenter: this.readFirstString(user, ['defaultAccessCenter', 'DefaultAccessCenter'])
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
                accessCenters: [],
                accessCenter: undefined,
                defaultAccessCenter: this.readFirstString(user, ['defaultAccessCenter', 'DefaultAccessCenter'])
              });

              return of({ user, session });
            }

            return this.resolveAccessCenterContext(user, request).pipe(
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

  private resolveAccessCenterContext(user: Record<string, unknown>, request: LoginRequest): Observable<LoginResult> {
    return this.getUserAccessCenterPermission(this.readUserId(user), request.companyId).pipe(
      map((response) => {
        const accessCenterPermissions = this.records(response)
          .filter((item) => {
            const permission = item as Record<string, unknown>;
            return this.readBoolean(permission, 'accessAllCompany') || this.readFirstString(permission, ['companyId', 'CompanyId']) === request.companyId;
          });

        if (!accessCenterPermissions.length) {
          throw new Error('User is not configured with any Access Center.');
        }

        const accessAllAccessCenters = accessCenterPermissions.some((item) => this.readBoolean(item as Record<string, unknown>, 'accessAllAccessCenter'));
        const defaultAccessCenter = this.readFirstString(user, ['defaultAccessCenter', 'DefaultAccessCenter']) || this.extractAccessCenterCode(accessCenterPermissions[0]);
        const session = this.createSessionContext(user, request, {
          superAdmin: false,
          showAllAccessCenters: accessAllAccessCenters,
          showAccessCenterSelection: true,
          accessCenters: accessCenterPermissions,
          accessCenter: accessAllAccessCenters ? undefined : defaultAccessCenter,
          defaultAccessCenter
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

  private extractAccessCenterCode(value: unknown): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const result = this.readFirstString(record, [
        'accessCenter',
        'AccessCenter',
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
