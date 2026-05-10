import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RoutePlanningService } from '../services/route-planning.service';
import { RouteOrder, RouteTrip, KpiSummary, HubSummary } from '../models/tms.models';

@Component({
  standalone: false,
  selector: 'app-route-dashboard',
  templateUrl: './route-dashboard.component.html',
  styleUrls: ['./route-dashboard.component.scss']
})
export class RouteDashboardComponent implements OnInit {

  kpi: KpiSummary = {
    pendingOrders: 0, unassignedOrders: 0,
    plannedTrips: 0, dispatchedTrips: 0,
    podPending: 0, delayedTrips: 0
  };

  hubSummaries: HubSummary[] = [];
  pendingOrders: RouteOrder[] = [];
  activeTrips: RouteTrip[]   = [];

  constructor(
    private svc: RoutePlanningService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.kpi = await firstValueFrom(this.svc.getKpiSummary());
    this.hubSummaries = await firstValueFrom(this.svc.getHubSummaries());
    const allOrders = await firstValueFrom(this.svc.getUnassignedOrders());
    this.pendingOrders = allOrders.slice(0, 8);
    const allTrips = await firstValueFrom(this.svc.getTrips());
    this.activeTrips = allTrips
      .filter(t => !['Closed'].includes(t.status))
      .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))
      .slice(0, 10);
  }

  goToPlanRoute(): void {
    this.router.navigate(['/tms/plan']);
  }

  goToTransporterSetup(): void {
    this.router.navigate(['/tms/setup/transporters']);
  }

  goToTruckSetup(): void {
    this.router.navigate(['/tms/setup/trucks']);
  }

  goToTripDetails(tripId: string): void {
    this.router.navigate(['/tms/trip', tripId]);
  }

  resetDemo(): void {
    // Since data is now from API, just reload
    this.load();
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      'Draft':       'secondary',
      'Planned':     'primary',
      'Loaded':      'warning',
      'Dispatched':  'info',
      'Delivered':   'success',
      'POD Pending': 'warning',
      'Closed':      'dark'
    };
    return `badge bg-${map[status] ?? 'secondary'}`;
  }

  orderStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'Pending':    'secondary',
      'Assigned':   'primary',
      'Dispatched': 'info',
      'Delivered':  'success'
    };
    return `badge bg-${map[status] ?? 'secondary'}`;
  }

  capacityPercent(trip: RouteTrip): number {
    return this.svc.capacityPercent(trip);
  }

  isOverloaded(trip: RouteTrip): boolean {
    return this.svc.isOverloaded(trip);
  }
}
