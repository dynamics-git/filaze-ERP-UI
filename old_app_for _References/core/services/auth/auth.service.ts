import { Injectable } from '@angular/core';
import { RestService } from '../rest.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private restService: RestService) { }

  getCompanies() {
    return this.restService.get('/companies');
  }

  getUserDeatils(comapny: string, email: string) {
    const filter = "?$filter=Email eq '" + email + "'";
    return this.restService.get('/companies(' + comapny + ')/portalUsers' + filter);
  }
  
  patchUserDeatils(comapny: string, id: string, body: any, ifMatchKey: any = null) {
    return this.restService.patch('/companies(' + comapny + ')/portalUsers(' + id + ')', body, ifMatchKey);
  }

  getUserRoleDetails(roleId: string) {
    return this.restService.get("/portalUsersRoles?$filter=RoleId eq '" + roleId + "'");
  }

  getUserResponsibilityCenterPermission(userId: string, companyId: string) {
    const filter = "?$filter=UserId eq '" + userId + "'";
    return this.restService.get('/companies(' + companyId + ')/portalResponsibilityPermissions' + filter);
  }

  getUserCompanyPermission(userId: string, companyId: string) {
    const filter = "?$filter=UserId eq '" + userId + "'";
    return this.restService.get('/companies(' + companyId + ')/portalCompanyPermissions' + filter);
  }
}
