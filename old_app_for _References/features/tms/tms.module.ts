import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { TmsRoutingModule } from './tms-routing.module';
import { FreightChargeSetupComponent } from './freight-charge-setup/freight-charge-setup.component';
import { RouteDashboardComponent } from './route-dashboard/route-dashboard.component';
import { PlanRouteComponent } from './plan-route/plan-route.component';
import { TripDetailsComponent } from './trip-details/trip-details.component';
import { TransporterSetupComponent } from './transporter-setup/transporter-setup.component';
import { TruckSetupComponent } from './truck-setup/truck-setup.component';

@NgModule({
  declarations: [
    FreightChargeSetupComponent,
    RouteDashboardComponent,
    PlanRouteComponent,
    TripDetailsComponent,
    TransporterSetupComponent,
    TruckSetupComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
    NgbModule,
    TmsRoutingModule
  ]
})
export class TmsModule {}
