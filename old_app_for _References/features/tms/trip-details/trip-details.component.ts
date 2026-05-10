import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RoutePlanningService } from '../services/route-planning.service';
import { RouteTrip, RouteOrder, TripStatus, WeighbridgeRecord } from '../models/tms.models';

const STATUS_FLOW: TripStatus[] = [
  'Draft', 'Planned', 'Loaded', 'Dispatched', 'Delivered', 'POD Pending', 'Closed'
];

@Component({
  standalone: false,
  selector: 'app-trip-details',
  templateUrl: './trip-details.component.html',
  styleUrls: ['./trip-details.component.scss']
})
export class TripDetailsComponent implements OnInit {

  trip: RouteTrip | null  = null;
  orders: RouteOrder[]    = [];
  statusFlow              = STATUS_FLOW;

  // Weighbridge form
  wb = { tare: 0, gross: 0 };
  wbEditing  = false;
  wbSaved    = false;

  // Status
  selectedStatus: TripStatus = 'Draft';

  // POD
  podDate = '';

  // Alerts
  alertMsg  = '';
  alertType = 'success';

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private svc:    RoutePlanningService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    await this.loadTrip(id);
  }

  async loadTrip(id: string): Promise<void> {
    this.trip = await firstValueFrom(this.svc.getTripById(id));
    if (!this.trip) { return; }
    this.orders = await firstValueFrom(this.svc.getOrdersByTrip(this.trip.id));
    this.selectedStatus = this.trip.status;
    this.podDate        = this.trip.podDate;

    if (this.trip.weighbridge) {
      this.wb.tare  = this.trip.weighbridge.tareWeight;
      this.wb.gross = this.trip.weighbridge.grossWeight;
    }
  }

  // ── Status ──────────────────────────────────────────────────────────────────
  async updateStatus(): Promise<void> {
    if (!this.trip) { return; }
    const ok = await firstValueFrom(this.svc.updateTripStatus(this.trip.id, this.selectedStatus));
    if (ok) {
      await this.loadTrip(this.trip.id);
      this.showAlert('success', `Status updated to ${this.selectedStatus}.`);
    }
  }

  statusIndex(status: TripStatus): number {
    return STATUS_FLOW.indexOf(status);
  }

  currentStatusIndex(): number {
    return this.trip ? STATUS_FLOW.indexOf(this.trip.status) : -1;
  }

  // ── Weighbridge ─────────────────────────────────────────────────────────────
  get netWeight(): number {
    if (!this.wb.gross || !this.wb.tare) { return 0; }
    return +(this.wb.gross - this.wb.tare).toFixed(3);
  }

  get isWbOverloaded(): boolean {
    if (!this.trip) { return false; }
    return this.netWeight > this.trip.truckCapacityTonne;
  }

  async saveWeighbridge(): Promise<void> {
    if (!this.trip) { return; }
    if (!this.wb.tare || !this.wb.gross) {
      this.showAlert('warning', 'Enter both tare and gross weight.');
      return;
    }
    if (this.wb.gross <= this.wb.tare) {
      this.showAlert('danger', 'Gross weight must be greater than tare weight.');
      return;
    }
    const record = await firstValueFrom(this.svc.recordWeighbridge(this.trip.id, this.wb.tare, this.wb.gross));
    if (record) {
      this.wbSaved   = true;
      this.wbEditing = false;
      await this.loadTrip(this.trip.id);
      this.showAlert('success', `Weighbridge recorded. Net: ${record.netWeight}T`);
    }
  }

  // ── POD ─────────────────────────────────────────────────────────────────────
  async savePod(): Promise<void> {
    if (!this.trip) { return; }
    if (!this.podDate) {
      this.showAlert('warning', 'Enter POD date.');
      return;
    }
    const ok = await firstValueFrom(this.svc.savePod(this.trip.id, this.podDate));
    if (ok) {
      await this.loadTrip(this.trip.id);
      this.showAlert('success', 'POD recorded. Trip closed.');
    }
  }

  // ── Navigate ────────────────────────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/tms/plan']);
  }

  goToDashboard(): void {
    this.router.navigate(['/tms']);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  statusBadgeClass(status: string): string {
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

  loadTypeBadge(lt: string): string {
    return lt === 'Bulk' ? 'badge bg-primary' : 'badge bg-secondary';
  }

  capacityPercent(): number {
    return this.trip ? this.svc.capacityPercent(this.trip) : 0;
  }

  isOverloaded(): boolean {
    return this.trip ? this.svc.isOverloaded(this.trip) : false;
  }

  formatDateTime(iso: string): string {
    if (!iso) { return '—'; }
    try {
      return new Date(iso).toLocaleString('en-MY', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  }

  private showAlert(type: string, msg: string): void {
    this.alertType = type;
    this.alertMsg  = msg;
    setTimeout(() => { this.alertMsg = ''; }, 5000);
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  get nextStatusOptions(): TripStatus[] {
    if (!this.trip) { return []; }
    return STATUS_FLOW.filter(s => s !== this.trip!.status);
  }
}