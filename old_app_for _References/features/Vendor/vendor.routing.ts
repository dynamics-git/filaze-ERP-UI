import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { RegisterVendorComponent } from './register-vendor/register-vendor.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'register',
        pathMatch: 'full'
      },
      {
        path: 'register',
        component: RegisterVendorComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VendorRoutingModule { }
