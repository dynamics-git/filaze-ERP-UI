import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResponsibilityCenterComponent } from './responsibility-center/responsibility-center.component';
import { UserResponsibilityPermissionsComponent } from './user-responsibility-permissions/user-responsibility-permissions.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ResponsibilityCenterRoutingModule } from './responsibility-center.routing';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ResponsibilityCenterComponent, 
    UserResponsibilityPermissionsComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    ResponsibilityCenterRoutingModule
  ]
})
export class ResponsibilityCenterModule { }
