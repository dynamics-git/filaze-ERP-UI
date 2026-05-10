import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { UserResponsibilityPermissionsComponent } from './user-responsibility-permissions/user-responsibility-permissions.component';
import { ResponsibilityCenterComponent } from './responsibility-center/responsibility-center.component';


const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        component: ResponsibilityCenterComponent
      },
      {
        path: 'permissions',
        component: UserResponsibilityPermissionsComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResponsibilityCenterRoutingModule { }
