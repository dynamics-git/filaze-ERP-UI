import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { HomeComponent } from './home/home.component';
import { SharedModule } from '../../shared/shared.module';
import { ClaimDashboardComponent } from './claim-dashboard/claim-dashboard.component';


@NgModule({
  declarations: [
    HomeComponent,
    ClaimDashboardComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    NgSelectModule,
    DashboardRoutingModule
  ]
})
export class DashboardModule { }
