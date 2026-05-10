import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { UserRolesComponent } from './user-roles/user-roles.component';
import { UsersComponent } from './users/users.component';
import { PageConfigurationComponent } from './page-configuration/page-configuration.component';
import { UserAccessControlComponent } from './user-access-control/user-access-control.component';
import { CompanyPermissionsComponent } from './company-permissions/company-permissions.component';
import { PortalReasonPageComponent } from './portal-reason-page/portal-reason-page.component';
import { ActiveUsersListComponent } from './active-users-list/active-users-list.component';
import { AddUsersComponent } from './users/add-users.component';
import { PortalSetupComponent } from '../claim/portal-setup/portal-setup.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full'
      },
      {
        path: 'pages',
        component: PageConfigurationComponent
      },
      {
        path: 'users',
        component: UsersComponent
      },
      // {
      //   path: 'users/:id',
      //   component: AddUsersComponent
      // },
      {
        path: 'roles',
        component: UserRolesComponent
      },
      {
        path: 'accesscontrol',
        component: UserAccessControlComponent
      },
      {
        path: 'company-permissions',
        component: CompanyPermissionsComponent
      },
      {
        path: 'portal-reasons',
        component: PortalReasonPageComponent
      },
      {
        path: 'activeUser',
        component: ActiveUsersListComponent
      },
      { path: 'portalSetup', component: PortalSetupComponent },
      { path: 'portalSetup/:id', component: PortalSetupComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserManagementRoutingModule { }
