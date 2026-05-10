import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { FreightChargeSetup, Hub, LoadType } from '../models/tms.models';
import { TmsAdminService } from '../services/tms-admin.service';

@Component({
  standalone: false,
  selector: 'app-freight-charge-setup',
  templateUrl: './freight-charge-setup.component.html',
  styleUrls: ['./freight-charge-setup.component.scss'],
})
export class FreightChargeSetupComponent implements OnInit {
  freightCharges: FreightChargeSetup[] = [];
  hubs: Hub[] = [];
  searchText = '';
  loading = false;
  saving = false;
  deletingId = '';
  showForm = false;
  editingItem: FreightChargeSetup | null = null;
  readonly allowDelete = true;

  readonly loadTypes: LoadType[] = ['Bulk', 'Bag'];
  readonly regions = ['Northern', 'Central', 'East', 'Southern'];

  readonly form = this.fb.group({
    code: [''],
    locationCode: ['', Validators.required],
    region: ['', Validators.required],
    loadType: ['Bulk' as LoadType, Validators.required],
    freightRate: [0, [Validators.required, Validators.min(0)]],
    handlingCharge: [0, [Validators.required, Validators.min(0)]],
    active: [true],
    remarks: [''],
  });

  constructor(
    private fb: FormBuilder,
    private adminService: TmsAdminService,
    private dialogService: UnifiedDialogService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  get filteredFreightCharges(): FreightChargeSetup[] {
    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      return this.freightCharges;
    }

    return this.freightCharges.filter((item) =>
      [
        item.code,
        item.locationCode,
        item.region,
        item.loadType,
        item.remarks,
        String(item.freightRate),
        String(item.handlingCharge),
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }

  async load(): Promise<void> {
    this.loading = true;

    try {
      const [hubs, freightCharges] = await Promise.all([
        firstValueFrom(this.adminService.getHubs()),
        firstValueFrom(this.adminService.getFreightCharges()),
      ]);

      this.hubs = hubs;
      this.freightCharges = freightCharges;
    } finally {
      this.loading = false;
    }
  }

  openCreate(): void {
    this.editingItem = null;
    this.form.reset({
      code: '',
      locationCode: '',
      region: '',
      loadType: 'Bulk',
      freightRate: 0,
      handlingCharge: 0,
      active: true,
      remarks: '',
    });
    this.showForm = true;
  }

  openEdit(item: FreightChargeSetup): void {
    this.editingItem = item;
    this.form.reset({
      code: item.code,
      locationCode: item.locationCode,
      region: item.region,
      loadType: item.loadType,
      freightRate: item.freightRate,
      handlingCharge: item.handlingCharge,
      active: item.active,
      remarks: item.remarks,
    });
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
        text: 'Location, region, load type, freight rate, and handling charge are required.',
      });
      return;
    }

    const raw = this.form.getRawValue();
    const payload: FreightChargeSetup = {
      apiId: this.editingItem?.apiId || raw.code || '',
      etag: this.editingItem?.etag || '',
      code: raw.code || '',
      locationCode: raw.locationCode || '',
      region: raw.region || '',
      loadType: (raw.loadType || 'Bulk') as LoadType,
      freightRate: Number(raw.freightRate || 0),
      handlingCharge: Number(raw.handlingCharge || 0),
      active: !!raw.active,
      remarks: raw.remarks || '',
    };

    this.saving = true;

    try {
      const result = this.editingItem
        ? await firstValueFrom(this.adminService.updateFreightCharge(payload))
        : await firstValueFrom(this.adminService.createFreightCharge(payload));

      if (!result) {
        await this.dialogService.showAlert('error', {
          title: 'Save Failed',
          text: 'Freight charge setup could not be saved.',
        });
        return;
      }

      await this.load();
      this.closeForm();
      await this.dialogService.showAlert('success', {
        title: 'Saved',
        text: 'Freight charge setup has been updated.',
      });
    } finally {
      this.saving = false;
    }
  }

  async delete(item: FreightChargeSetup): Promise<void> {
    if (!this.allowDelete) {
      return;
    }

    const confirmed = await this.dialogService.confirmDelete({
      message: `Delete freight charge ${item.code || item.locationCode}?`,
    });

    if (!confirmed) {
      return;
    }

    this.deletingId = item.apiId;

    try {
      const ok = await firstValueFrom(this.adminService.deleteFreightCharge(item));

      if (!ok) {
        await this.dialogService.showAlert('warning', {
          title: 'Delete Not Completed',
          text: 'The BC API did not accept the delete request for this freight charge.',
        });
        return;
      }

      await this.load();
      await this.dialogService.showAlert('success', {
        title: 'Deleted',
        text: 'Freight charge removed successfully.',
      });
    } finally {
      this.deletingId = '';
    }
  }

  async toggleActive(item: FreightChargeSetup): Promise<void> {
    const updated = await firstValueFrom(this.adminService.setFreightChargeActive(item, !item.active));

    if (!updated) {
      await this.dialogService.showAlert('warning', {
        title: 'Update Failed',
        text: 'Freight charge status could not be changed.',
      });
      return;
    }

    item.active = updated.active;
    item.etag = updated.etag;
  }

  hubLabel(code: string): string {
    return this.hubs.find((item) => item.id === code)?.name || code;
  }

  trackByFreightCharge(_: number, item: FreightChargeSetup): string {
    return item.apiId || item.code;
  }
}
