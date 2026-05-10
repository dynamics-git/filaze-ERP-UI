import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserManagementRoutingModule } from './user-management.routing';
import { UserRolesComponent } from './user-roles/user-roles.component';
import { UsersComponent } from './users/users.component';
import { PageConfigurationComponent } from './page-configuration/page-configuration.component';
import { UserAccessControlComponent } from './user-access-control/user-access-control.component';
import { CompanyPermissionsComponent } from './company-permissions/company-permissions.component';
import { PortalReasonPageComponent } from './portal-reason-page/portal-reason-page.component';
import { ActiveUsersListComponent } from './active-users-list/active-users-list.component';
import { SharedModule } from '../../shared/shared.module';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AddUsersComponent } from './users/add-users.component';
import { ButtonPermissionComponent } from './button-permission/button-permission.component';

@NgModule({
  declarations: [
    PageConfigurationComponent,
    UsersComponent,
    AddUsersComponent,
    UserRolesComponent,
    UserAccessControlComponent,
    CompanyPermissionsComponent,
    PortalReasonPageComponent,
    ActiveUsersListComponent,
    ButtonPermissionComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    UserManagementRoutingModule,
    NgxSkeletonLoaderModule
  ],
  providers: []
})
export class UserManagementModule { }
