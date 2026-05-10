import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { UserResponsibilityPermissionLineConfig } from './user-responsibility-permissions.config';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';
import { RestService } from '../../../core/services/rest.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { Utility } from '../../../core/services/utility.service';
import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { LINE_WORKSPACE_PAGE_TEMPLATE } from '../../../shared/components/line-workspace/line-workspace-page.template';
import { LineWorkspacePageBase } from '../../../shared/components/line-workspace/line-workspace-page.base';

@Component({
  standalone: false,
  selector: 'app-user-responsibility-permissions',
  template: LINE_WORKSPACE_PAGE_TEMPLATE
})
export class UserResponsibilityPermissionsComponent extends LineWorkspacePageBase implements OnInit {

  protected lineDataConfig: LineDataConfig = UserResponsibilityPermissionLineConfig;

  constructor(
    fb: FormBuilder,
    toastr: ToastrService,
    restService: RestService,
    utility: Utility,
    dialogService: UnifiedDialogService,
    cdr: ChangeDetectorRef,
    zone: NgZone) {
    super(fb, toastr, restService, utility, dialogService, cdr, zone);
  }

  protected override applyRowState(itemGroup: FormGroup, line: any): void {
    if (line.AccessAllCompany) {
      itemGroup.get('Company')!.disable();
    }

    if (line.AccessAllResCentre) {
      itemGroup.get('PortalResponsibilityCentre')!.disable();
    }
  }

  changeLineControl(data: ControlDataModel, rowIndex: number) {
    const itemGroup = this.items.controls[rowIndex] as FormGroup;
    const index = itemGroup.get('index')!.value;
    if (data.control === 'Company') {
      if (itemGroup.get('AccessAllCompany')!.value) {
        itemGroup.get('Company')!.setValue(null, { emitEvent: false });
        this.lines[rowIndex].Company = null;
        this.lines[rowIndex].CompanyId = null;
        this.lines[rowIndex].AccessAllCompany = itemGroup.get('AccessAllCompany')!.value;
      } else {
        this.lines[rowIndex].Company = data.dropdownData.name;
        this.lines[rowIndex].CompanyId = data.dropdownData.id;
        this.lines[rowIndex].AccessAllCompany = itemGroup.get('AccessAllCompany')!.value;
      }
    } else if (data.control === 'AccessAllCompany') {
      if (itemGroup.get('AccessAllCompany')!.value) {
        itemGroup.get('Company')!.setValue(null, { emitEvent: false });
        itemGroup.get('Company')!.disable();
        this.lines[rowIndex].Company = null;
        this.lines[rowIndex].CompanyId = null;
        this.lines[rowIndex].AccessAllCompany = itemGroup.get('AccessAllCompany')!.value;
      } else {
        itemGroup.get('Company')!.enable();
      }
    } else if (data.control === 'PortalResponsibilityCentre') {
      if (itemGroup.get('AccessAllResCentre')!.value) {
        itemGroup.get('AccessAllResCentre')!.setValue(null, { emitEvent: false });
        this.lines[rowIndex].PortalResponsibilityCentre = null;
        this.lines[rowIndex].AccessAllResCentre = itemGroup.get('AccessAllResCentre')!.value;
      } else {
        this.lines[rowIndex].PortalResponsibilityCentre = itemGroup.get('PortalResponsibilityCentre')!.value;
        this.lines[rowIndex].AccessAllResCentre = itemGroup.get('AccessAllResCentre')!.value;
      }
    } else if (data.control === 'AccessAllResCentre') {
      if (itemGroup.get('AccessAllResCentre')!.value) {
        itemGroup.get('PortalResponsibilityCentre')!.setValue(null, { emitEvent: false });
        itemGroup.get('PortalResponsibilityCentre')!.disable();
        this.lines[rowIndex].PortalResponsibilityCentre = null;
        this.lines[rowIndex].AccessAllResCentre = itemGroup.get('AccessAllResCentre')!.value;
      } else {
        itemGroup.get('PortalResponsibilityCentre')!.enable();
      }
    } else {
      this.lines[rowIndex][data.control] = data.data;
    }

    this.originalLines[index] = this.utility.copyObj(this.lines[rowIndex]);
    if (itemGroup.valid) {
      this.saveLineItemRecord(rowIndex, index);
    }
  }

  private saveLineItemRecord(rowIndex: number, index: number) {
    let record = this.lines[rowIndex];
    if (record[this.lineDataConfig.idProp!]) {
      let patchData = {
        Company: record.Company,
        CompanyId: record.CompanyId,
        AccessAllCompany: record.AccessAllCompany,
        PortalResponsibilityCentre: record.PortalResponsibilityCentre,
        AccessAllResCentre: record.AccessAllResCentre
      };
      this.updateLineItemRecord(record, patchData, rowIndex, index);
    } else {
      this.addLineItemRecord(this.utility.getLineControlsData(record, this.lineDataConfig.controls!), rowIndex, index);
    }
  }

  leaveLineControl(data: ControlDataModel, row: number) {
  }
}
