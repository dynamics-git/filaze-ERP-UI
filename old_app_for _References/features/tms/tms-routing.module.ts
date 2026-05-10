import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteDashboardComponent } from './route-dashboard/route-dashboard.component';
import { PlanRouteComponent } from './plan-route/plan-route.component';
import { TripDetailsComponent } from './trip-details/trip-details.component';
import { FreightChargeSetupComponent } from './freight-charge-setup/freight-charge-setup.component';
import { TransporterSetupComponent } from './transporter-setup/transporter-setup.component';
import { TruckSetupComponent } from './truck-setup/truck-setup.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: '',      redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: RouteDashboardComponent },
      { path: 'plan',      component: PlanRouteComponent },
      { path: 'trip/:id',  component: TripDetailsComponent },
      { path: 'setup/freight-charges', component: FreightChargeSetupComponent },
      { path: 'setup/transporters', component: TransporterSetupComponent },
      { path: 'setup/trucks', component: TruckSetupComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TmsRoutingModule {}
