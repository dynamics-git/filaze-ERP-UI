import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { LoadType, TransporterSetup } from '../models/tms.models';
import { TmsAdminService } from '../services/tms-admin.service';

@Component({
  standalone: false,
  selector: 'app-transporter-setup',
  templateUrl: './transporter-setup.component.html',
  styleUrls: ['./transporter-setup.component.scss'],
})
export class TransporterSetupComponent implements OnInit {
  transporters: TransporterSetup[] = [];
  searchText = '';
  loading = false;
  saving = false;
  deletingId = '';
  showForm = false;
  editingItem: TransporterSetup | null = null;

  readonly freightTypes: Array<LoadType | ''> = ['', 'Bulk', 'Bag'];

  readonly form = this.fb.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    phoneNo: [''],
    email: [''],
    active: [true],
    defaultFreightType: ['' as LoadType | ''],
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

  get filteredTransporters(): TransporterSetup[] {
    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      return this.transporters;
    }

    return this.transporters.filter((item) =>
      [item.code, item.name, item.phoneNo, item.email, item.remarks]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }

  async load(): Promise<void> {
    this.loading = true;

    try {
      this.transporters = await firstValueFrom(this.adminService.getTransporters());
    } finally {
      this.loading = false;
    }
  }

  openCreate(): void {
    this.editingItem = null;
    this.form.reset({
      code: '',
      name: '',
      phoneNo: '',
      email: '',
      active: true,
      defaultFreightType: '',
      remarks: '',
    });
    this.form.get('code')?.enable();
    this.showForm = true;
  }

  openEdit(item: TransporterSetup): void {
    this.editingItem = item;
    this.form.reset({
      code: item.code,
      name: item.name,
      phoneNo: item.phoneNo,
      email: item.email,
      active: item.active,
      defaultFreightType: item.defaultFreightType,
      remarks: item.remarks,
    });
    this.form.get('code')?.disable();
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
        text: 'Code and name are required before saving.',
      });
      return;
    }

    const raw = this.form.getRawValue();
    const payload: TransporterSetup = {
      apiId: this.editingItem?.apiId || raw.code || '',
      etag: this.editingItem?.etag || '',
      code: raw.code || '',
      name: raw.name || '',
      phoneNo: raw.phoneNo || '',
      email: raw.email || '',
      active: !!raw.active,
      defaultFreightType: (raw.defaultFreightType || '') as LoadType | '',
      remarks: raw.remarks || '',
    };

    this.saving = true;

    try {
      const result = this.editingItem
        ? await firstValueFrom(this.adminService.updateTransporter(payload))
        : await firstValueFrom(this.adminService.createTransporter(payload));

      if (!result) {
        await this.dialogService.showAlert('error', {
          title: 'Save Failed',
          text: 'Transporter could not be saved.',
        });
        return;
      }

      await this.load();
      this.closeForm();
      await this.dialogService.showAlert('success', {
        title: 'Saved',
        text: 'Transporter setup has been updated.',
      });
    } finally {
      this.saving = false;
    }
  }

  async delete(item: TransporterSetup): Promise<void> {
    const confirmed = await this.dialogService.confirmDelete({
      message: `Delete transporter ${item.code}?`,
    });

    if (!confirmed) {
      return;
    }

    this.deletingId = item.apiId;

    try {
      const ok = await firstValueFrom(this.adminService.deleteTransporter(item));

      if (!ok) {
        await this.dialogService.showAlert('warning', {
          title: 'Delete Not Completed',
          text: 'The BC API did not accept the delete request for this transporter.',
        });
        return;
      }

      await this.load();
      await this.dialogService.showAlert('success', {
        title: 'Deleted',
        text: 'Transporter removed successfully.',
      });
    } finally {
      this.deletingId = '';
    }
  }

  async toggleActive(item: TransporterSetup): Promise<void> {
    const updated = await firstValueFrom(this.adminService.setTransporterActive(item, !item.active));

    if (!updated) {
      await this.dialogService.showAlert('warning', {
        title: 'Update Failed',
        text: 'Transporter status could not be changed.',
      });
      return;
    }

    item.active = updated.active;
    item.etag = updated.etag;
  }

  trackByTransporter(_: number, item: TransporterSetup): string {
    return item.apiId || item.code;
  }
}
