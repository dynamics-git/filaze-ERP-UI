import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import {
  Hub,
  NewTripForm,
  RouteOrder,
  RouteTrip,
  Transporter,
  Truck,
} from '../models/tms.models';
import { RoutePlanningService } from '../services/route-planning.service';

@Component({
  standalone: false,
  selector: 'app-plan-route',
  templateUrl: './plan-route.component.html',
  styleUrls: ['./plan-route.component.scss'],
})
export class PlanRouteComponent implements OnInit {
  hubs: Hub[] = [];
  transporters: Transporter[] = [];
  allTrucks: Truck[] = [];
  filteredTrucks: Truck[] = [];

  orders: RouteOrder[] = [];
  trips: RouteTrip[] = [];
  tripOrdersMap: Record<string, RouteOrder[]> = {};
  selectedOrderIds = new Set<string>();
  selectedTripId = '';
  rowTargetTripIds: Record<string, string> = {};

  filterHub = '';
  filterLoadType = '';
  filterDate = '';
  showNewTripForm = true;
  loading = false;
  assigning = false;
  creating = false;
  reassigningOrderId = '';
  removingOrderId = '';

  newTrip: NewTripForm = {
    hubId: '',
    transporterId: '',
    truckId: '',
    loadType: 'Bulk',
    plannedDate: '',
    notes: '',
  };

  alertMsg = '';
  alertType = 'success';

  constructor(
    private svc: RoutePlanningService,
    private router: Router,
    private dialogService: UnifiedDialogService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;

    try {
      this.hubs = await firstValueFrom(this.svc.getHubs());
      this.transporters = await firstValueFrom(this.svc.getTransporters());
      this.allTrucks = await firstValueFrom(this.svc.getTrucks());
      this.newTrip.plannedDate = this.today;
      await this.loadData();
    } finally {
      this.loading = false;
    }
  }

  get filteredOrders(): RouteOrder[] {
    return this.orders.filter((item) => {
      if (this.filterHub && item.hubId !== this.filterHub) {
        return false;
      }

      if (this.filterLoadType && item.loadType !== this.filterLoadType) {
        return false;
      }

      if (this.filterDate && item.deliveryDate !== this.filterDate) {
        return false;
      }

      return true;
    });
  }

  get selectedTrip(): RouteTrip | null {
    return this.trips.find((item) => item.id === this.selectedTripId) || null;
  }

  get draftTrips(): RouteTrip[] {
    return this.trips.filter((item) => item.status === 'Draft');
  }

  get plannedTrips(): RouteTrip[] {
    return this.trips.filter((item) => item.status === 'Planned');
  }

  get totalTripLoadTonne(): number {
    return this.trips.reduce((sum, item) => sum + item.totalWeightTonne, 0);
  }

  get selectedOrders(): RouteOrder[] {
    return this.filteredOrders.filter((item) => this.selectedOrderIds.has(item.id));
  }

  get selectedOrderWeight(): number {
    return this.selectedOrders.reduce((sum, item) => sum + item.weightTonne, 0);
  }

  get selectedLoadTypes(): string {
    const types = Array.from(new Set(this.selectedOrders.map((item) => item.loadType)));
    return types.length ? types.join(', ') : '-';
  }

  get canAssignSelected(): boolean {
    return !!this.selectedTripId && this.selectedOrderIds.size > 0 && !this.assigning;
  }

  get trucksForLoadType(): Truck[] {
    return this.filteredTrucks;
  }

  async loadData(): Promise<void> {
    const [orders, allTrips] = await Promise.all([
      firstValueFrom(this.svc.getUnassignedOrders()),
      firstValueFrom(this.svc.getTrips()),
    ]);

    this.orders = orders;
    this.trips = allTrips
      .filter((item) => ['Draft', 'Planned'].includes(item.status))
      .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));

    const tripOrderEntries = await Promise.all(
      this.trips.map(async (trip) => [trip.id, await firstValueFrom(this.svc.getOrdersByTrip(trip.id))] as const)
    );

    this.tripOrdersMap = Object.fromEntries(tripOrderEntries);

    if (this.selectedTripId && !this.trips.some((item) => item.id === this.selectedTripId)) {
      this.selectedTripId = '';
    }

    if (!this.selectedTripId && this.trips.length === 1) {
      this.selectedTripId = this.trips[0].id;
    }

    if (!this.trips.length) {
      this.showNewTripForm = true;
    }

    this.syncTruckFilter();
  }

  toggleOrder(orderId: string): void {
    if (this.selectedOrderIds.has(orderId)) {
      this.selectedOrderIds.delete(orderId);
    } else {
      this.selectedOrderIds.add(orderId);
    }

    if (!this.selectedTripId && this.trips.length === 1) {
      this.selectedTripId = this.trips[0].id;
    }
  }

  isSelected(orderId: string): boolean {
    return this.selectedOrderIds.has(orderId);
  }

  selectAll(): void {
    this.filteredOrders.forEach((item) => this.selectedOrderIds.add(item.id));
  }

  clearSelection(): void {
    this.selectedOrderIds.clear();
  }

  onTransporterChange(): void {
    this.syncTruckFilter();
  }

  onLoadTypeChange(): void {
    this.syncTruckFilter();
  }

  toggleNewTripForm(): void {
    this.showNewTripForm = !this.showNewTripForm;

    if (!this.showNewTripForm) {
      return;
    }

    if (!this.newTrip.plannedDate) {
      this.newTrip.plannedDate = this.today;
    }

    this.syncTruckFilter();
  }

  async assignSelected(): Promise<void> {
    if (!this.selectedTripId) {
      this.showAlert('warning', 'Select a trip first.');
      return;
    }

    if (this.selectedOrderIds.size === 0) {
      this.showAlert('warning', 'Select at least one order.');
      return;
    }

    const trip = this.selectedTrip;
    if (!trip) {
      return;
    }

    this.assigning = true;

    try {
      let assigned = 0;
      let blocked = 0;
      let currentBulkCount = trip.orderIds.length;
      const errors: string[] = [];

      for (const order of this.selectedOrders) {
        if (order.loadType !== trip.loadType) {
          blocked++;
          continue;
        }

        if (trip.loadType === 'Bulk' && currentBulkCount >= 1) {
          blocked++;
          continue;
        }

        const result = await firstValueFrom(this.svc.assignOrderToTripDetailed(order, this.selectedTripId));
        if (result.ok) {
          assigned++;
          if (trip.loadType === 'Bulk') {
            currentBulkCount++;
          }
        } else {
          blocked++;
          errors.push(result.message);
        }
      }

      this.selectedOrderIds.clear();
      await this.loadData();

      if (assigned > 0 && blocked === 0) {
        this.showAlert('success', `${assigned} order(s) assigned successfully.`);
      } else if (assigned > 0) {
        this.showAlert('warning', `${assigned} assigned. ${blocked} skipped. ${errors[0] || 'Check load type compatibility or Bulk rule.'}`);
      } else {
        this.showAlert('danger', errors[0] || 'No orders assigned. Check load type compatibility or Bulk rule.');
      }
    } finally {
      this.assigning = false;
    }
  }

  async submitNewTrip(): Promise<void> {
    const trip = this.newTrip;
    if (!trip.hubId || !trip.transporterId || !trip.truckId || !trip.plannedDate) {
      this.showAlert('warning', 'Please fill in all required trip fields.');
      return;
    }

    this.creating = true;

    try {
      const { trip: created, result } = await firstValueFrom(
        this.svc.createTripDetailed(
          trip.hubId,
          trip.transporterId,
          trip.truckId,
          trip.loadType,
          trip.plannedDate,
          trip.notes
        )
      );

      if (!created) {
        this.showAlert('danger', result.message);
        await this.dialogService.showAlert('error', {
          title: 'Unable to Create Trip',
          text: result.message,
        });
        return;
      }

      this.selectedTripId = created.id;
      this.resetNewTripForm();
      await this.loadData();
      this.showAlert('success', result.message);
    } finally {
      this.creating = false;
    }
  }

  cancelNewTrip(): void {
    this.resetNewTripForm();
  }

  async markPlanned(tripId: string): Promise<void> {
    const trip = this.trips.find((item) => item.id === tripId);
    if (trip && trip.orderIds.length === 0) {
      this.showAlert('warning', 'Cannot mark as Planned until at least one order is assigned.');
      return;
    }

    const ok = await firstValueFrom(this.svc.updateTripStatus(tripId, 'Planned'));
    if (ok) {
      await this.loadData();
      this.showAlert('success', 'Trip marked as Planned.');
    }
  }

  selectTrip(tripId: string): void {
    this.selectedTripId = tripId;
  }

  availableReassignmentTrips(currentTrip: RouteTrip, order: RouteOrder): RouteTrip[] {
    return this.trips.filter((trip) => {
      if (trip.id === currentTrip.id || trip.loadType !== order.loadType) {
        return false;
      }

      if (trip.loadType === 'Bulk' && this.getOrdersForTrip(trip).length >= 1) {
        return false;
      }

      return true;
    });
  }

  async removeFromTrip(order: RouteOrder, tripId: string): Promise<void> {
    const confirmed = await this.dialogService.confirmDelete({
      title: 'Remove Order',
      message: `Remove order ${order.orderNo} from trip ${tripId}?`,
      yesButtonText: 'Remove',
    });

    if (!confirmed) {
      return;
    }

    this.removingOrderId = order.id;

    try {
      const result = await firstValueFrom(this.svc.unassignOrderFromTripDetailed(order, tripId));
      if (result.ok) {
        delete this.rowTargetTripIds[order.id];
        await this.loadData();
        this.showAlert('success', result.message);
        return;
      }

      this.showAlert('danger', result.message);
      await this.dialogService.showAlert('error', {
        title: 'Unable to Remove Order',
        text: result.message,
      });
    } finally {
      this.removingOrderId = '';
    }
  }

  async reassignOrder(order: RouteOrder, fromTrip: RouteTrip): Promise<void> {
    const targetTripId = this.rowTargetTripIds[order.id];
    if (!targetTripId) {
      this.showAlert('warning', `Choose a destination trip for order ${order.orderNo}.`);
      return;
    }

    const targetTrip = this.trips.find((item) => item.id === targetTripId);
    if (!targetTrip) {
      this.showAlert('warning', 'Selected destination trip was not found.');
      return;
    }

    if (targetTrip.loadType !== order.loadType) {
      this.showAlert('warning', `Order ${order.orderNo} cannot move to a ${targetTrip.loadType} trip.`);
      return;
    }

    if (targetTrip.loadType === 'Bulk' && this.getOrdersForTrip(targetTrip).length >= 1) {
      this.showAlert('warning', `Trip ${targetTrip.tripNo} already has a Bulk order.`);
      return;
    }

    this.reassigningOrderId = order.id;

    try {
      const result = await firstValueFrom(this.svc.reassignOrderToTrip(order, fromTrip.id, targetTrip.id));
      if (result.ok) {
        delete this.rowTargetTripIds[order.id];
        await this.loadData();
        this.showAlert('success', result.message);
        return;
      }

      this.showAlert('danger', result.message);
      await this.dialogService.showAlert('error', {
        title: 'Unable to Reassign Order',
        text: result.message,
      });
    } finally {
      this.reassigningOrderId = '';
    }
  }

  getOrdersForTrip(trip: RouteTrip): RouteOrder[] {
    return this.tripOrdersMap[trip.id] || [];
  }

  getTripSummary(trip: RouteTrip): string {
    const orders = this.getOrdersForTrip(trip).length;
    const weight = `${trip.totalWeightTonne.toFixed(1)}T`;
    return `${orders} order(s) - ${weight}`;
  }

  capacityPercent(trip: RouteTrip): number {
    return this.svc.capacityPercent(trip);
  }

  isOverloaded(trip: RouteTrip): boolean {
    return this.svc.isOverloaded(trip);
  }

  tripStatusBadge(status: string): string {
    const map: Record<string, string> = {
      Draft: 'badge bg-secondary-subtle text-secondary border border-secondary-subtle',
      Planned: 'badge bg-primary-subtle text-primary border border-primary-subtle',
    };
    return map[status] || 'badge bg-secondary-subtle text-secondary border border-secondary-subtle';
  }

  orderLoadBadge(loadType: string): string {
    return loadType === 'Bulk'
      ? 'badge bg-primary-subtle text-primary border border-primary-subtle'
      : 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle';
  }

  goToDetails(tripId: string): void {
    this.router.navigate(['/tms/trip', tripId]);
  }

  goBack(): void {
    this.router.navigate(['/tms']);
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private syncTruckFilter(): void {
    this.newTrip.truckId = '';
    this.filteredTrucks = this.allTrucks.filter(
      (item) =>
        (!this.newTrip.transporterId || item.transporterId === this.newTrip.transporterId) &&
        item.loadType === this.newTrip.loadType
    );

    if (this.filteredTrucks.length === 1) {
      this.newTrip.truckId = this.filteredTrucks[0].id;
    }
  }

  private resetNewTripForm(): void {
    this.showNewTripForm = true;
    this.newTrip = {
      hubId: '',
      transporterId: '',
      truckId: '',
      loadType: 'Bulk',
      plannedDate: this.today,
      notes: '',
    };
    this.filteredTrucks = [];
  }

  private showAlert(type: string, msg: string): void {
    this.alertType = type;
    this.alertMsg = msg;
    setTimeout(() => {
      this.alertMsg = '';
    }, 4000);
  }
}
