import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { VendorRoutingModule } from './vendor.routing';
import { RegisterVendorComponent } from './register-vendor/register-vendor.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    RegisterVendorComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    VendorRoutingModule
  ]
})
export class VendorModule { }
