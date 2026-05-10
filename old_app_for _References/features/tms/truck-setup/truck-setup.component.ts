import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { LoadType, TransporterSetup, TruckSetup } from '../models/tms.models';
import { TmsAdminService } from '../services/tms-admin.service';

@Component({
  standalone: false,
  selector: 'app-truck-setup',
  templateUrl: './truck-setup.component.html',
  styleUrls: ['./truck-setup.component.scss'],
})
export class TruckSetupComponent implements OnInit {
  trucks: TruckSetup[] = [];
  transporters: TransporterSetup[] = [];
  searchText = '';
  transporterFilter = '';
  loadTypeFilter = '';
  loading = false;
  saving = false;
  deletingId = '';
  showForm = false;
  editingItem: TruckSetup | null = null;

  readonly loadTypes: LoadType[] = ['Bulk', 'Bag'];

  readonly form = this.fb.group({
    truckNo: ['', Validators.required],
    transporterId: ['', Validators.required],
    plateNo: ['', Validators.required],
    loadType: ['Bulk' as LoadType, Validators.required],
    capacityTonne: [0, [Validators.required, Validators.min(0.001)]],
    gpsEnabled: [false],
    active: [true],
  });

  constructor(
    private fb: FormBuilder,
    private adminService: TmsAdminService,
    private dialogService: UnifiedDialogService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  get filteredTrucks(): TruckSetup[] {
    const search = this.searchText.trim().toLowerCase();

    return this.trucks.filter((item) => {
      if (this.transporterFilter && item.transporterId !== this.transporterFilter) {
        return false;
      }

      if (this.loadTypeFilter && item.loadType !== this.loadTypeFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [item.truckNo, item.plateNo, item.transporterId, item.transporterName]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }

  async load(): Promise<void> {
    this.loading = true;

    try {
      const [transporters, trucks] = await Promise.all([
        firstValueFrom(this.adminService.getTransporters()),
        firstValueFrom(this.adminService.getTrucks()),
      ]);

      this.transporters = transporters;
      this.trucks = trucks.map((item) => ({
        ...item,
        transporterName:
          item.transporterName ||
          transporters.find((transporter) => transporter.code === item.transporterId)?.name ||
          item.transporterId,
      }));
    } finally {
      this.loading = false;
    }
  }

  openCreate(): void {
    this.editingItem = null;
    this.form.reset({
      truckNo: '',
      transporterId: '',
      plateNo: '',
      loadType: 'Bulk',
      capacityTonne: 0,
      gpsEnabled: false,
      active: true,
    });
    this.form.get('truckNo')?.enable();
    this.showForm = true;
  }

  openEdit(item: TruckSetup): void {
    this.editingItem = item;
    this.form.reset({
      truckNo: item.truckNo,
      transporterId: item.transporterId,
      plateNo: item.plateNo,
      loadType: item.loadType,
      capacityTonne: item.capacityTonne,
      gpsEnabled: item.gpsEnabled,
      active: item.active,
    });
    this.form.get('truckNo')?.disable();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingItem = null;
    this.form.reset();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.dialogService.showAlert('warning', {
        title: 'Incomplete',
        text: 'Truck number, transporter, plate number, load type and capacity are required.',
      });
      return;
    }

    const raw = this.form.getRawValue();
    const transporterName =
      this.transporters.find((item) => item.code === raw.transporterId)?.name || raw.transporterId || '';

    const payload: TruckSetup = {
      apiId: this.editingItem?.apiId || raw.truckNo || '',
      etag: this.editingItem?.etag || '',
      truckNo: raw.truckNo || '',
      transporterId: raw.transporterId || '',
      transporterName,
      plateNo: raw.plateNo || '',
      loadType: (raw.loadType || 'Bulk') as LoadType,
      capacityTonne: Number(raw.capacityTonne || 0),
      gpsEnabled: !!raw.gpsEnabled,
      active: !!raw.active,
    };

    this.saving = true;

    try {
      const result = this.editingItem
        ? await firstValueFrom(this.adminService.updateTruck(payload))
        : await firstValueFrom(this.adminService.createTruck(payload));

      if (!result) {
        await this.dialogService.showAlert('error', {
          title: 'Save Failed',
          text: 'Truck could not be saved.',
        });
        return;
      }

      await this.load();
      this.closeForm();
      await this.dialogService.showAlert('success', {
        title: 'Saved',
        text: 'Truck setup has been updated.',
      });
    } finally {
      this.saving = false;
    }
  }

  async delete(item: TruckSetup): Promise<void> {
    const confirmed = await this.dialogService.confirmDelete({
      message: `Delete truck ${item.truckNo}?`,
    });

    if (!confirmed) {
      return;
    }

    this.deletingId = item.apiId;

    try {
      const ok = await firstValueFrom(this.adminService.deleteTruck(item));

      if (!ok) {
        await this.dialogService.showAlert('warning', {
          title: 'Delete Not Completed',
          text: 'The BC API did not accept the delete request for this truck.',
        });
        return;
      }

      await this.load();
      await this.dialogService.showAlert('success', {
        title: 'Deleted',
        text: 'Truck removed successfully.',
      });
    } finally {
      this.deletingId = '';
    }
  }

  async toggleActive(item: TruckSetup): Promise<void> {
    const updated = await firstValueFrom(this.adminService.setTruckActive(item, !item.active));

    if (!updated) {
      await this.dialogService.showAlert('warning', {
        title: 'Update Failed',
        text: 'Truck status could not be changed.',
      });
      return;
    }

    item.active = updated.active;
    item.etag = updated.etag;
  }

  transporterLabel(code: string): string {
    return this.transporters.find((item) => item.code === code)?.name || code;
  }

  trackByTruck(_: number, item: TruckSetup): string {
    return item.apiId || item.truckNo;
  }
}
