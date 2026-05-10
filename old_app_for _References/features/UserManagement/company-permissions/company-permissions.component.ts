import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CompanyPermissionLineConfig } from './company-permission.cofig';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';
import { RestService } from '../../../core/services/rest.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { Utility } from '../../../core/services/utility.service';
import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { LINE_WORKSPACE_PAGE_TEMPLATE } from '../../../shared/components/line-workspace/line-workspace-page.template';
import { LineWorkspacePageBase } from '../../../shared/components/line-workspace/line-workspace-page.base';

@Component({
  standalone: false,
  selector: 'app-company-permissions',
  template: LINE_WORKSPACE_PAGE_TEMPLATE
})
export class CompanyPermissionsComponent extends LineWorkspacePageBase implements OnInit {

  protected lineDataConfig: LineDataConfig = CompanyPermissionLineConfig;

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
  }

  changeLineControl(data: ControlDataModel, rowIndex: number) {
    const itemGroup = this.items.controls[rowIndex] as FormGroup;
    const index = itemGroup.get('index')!.value;
    if (data.control === 'UserId') {
      this.lines[rowIndex].UserId = itemGroup.get('UserId')!.value;
      const index = this.lines.findIndex(x => x.UserId == this.lines[rowIndex].UserId && x.AccessAllCompany);
      if (index > -1 && index !== rowIndex) {
        this.toastr.warning('The User ' + this.lines[rowIndex].UserId + ' has been already assigned to an individual company, please remove the line before giving permission to All Companies');
        this.lines[rowIndex].UserId = null;
        itemGroup.get('UserId')!.setValue(null, { emitEvent: false });
      }
    } else if (data.control === 'Company') {
      if (itemGroup.get('AccessAllCompany')!.value) {
        itemGroup.get('Company')!.setValue(null, { emitEvent: false });
        this.lines[rowIndex].Company = null;
        this.lines[rowIndex].CompanyId = null;
        this.lines[rowIndex].AccessAllCompany = itemGroup.get('AccessAllCompany')!.value;
        this.saveLineItemRecord(rowIndex);
      } else {
        this.lines[rowIndex].Company = data.dropdownData.name;
        this.lines[rowIndex].CompanyId = data.dropdownData.id;
        const lineWithAccessAllCompany = this.lines.filter(x => x.UserId == this.lines[rowIndex].UserId && x.AccessAllCompany)[0];
        if (lineWithAccessAllCompany) {
          this.toastr.warning('The User ' + this.lines[rowIndex].UserId + ' has been already assigned to an individual company, please remove the line before giving permission to All Companies');
          this.lines[rowIndex].Company = null;
          this.lines[rowIndex].CompanyId = null;
          itemGroup.get('Company')!.setValue(null, { emitEvent: false });
        } else {
          this.lines[rowIndex].AccessAllCompany = itemGroup.get('AccessAllCompany')!.value;
          this.saveLineItemRecord(rowIndex);
        }
      }
    } else if (data.control === 'AccessAllCompany') {
      if (data.data) {
        itemGroup.get('Company')!.setValue(null, { emitEvent: false });
        itemGroup.get('Company')!.disable();
        this.lines[rowIndex].Company = null;
        this.lines[rowIndex].CompanyId = null;
        this.lines[rowIndex].AccessAllCompany = itemGroup.get('AccessAllCompany')!.value;
        this.saveLineItemRecord(rowIndex);
      } else {
        itemGroup.get('Company')!.enable();
      }
    }

    this.originalLines[index] = this.utility.copyObj(this.lines[rowIndex]);
  }

  private saveLineItemRecord(rowIndex: number) {
    const itemGroup = this.items.controls[rowIndex] as FormGroup;
    const index = itemGroup.get('index')!.value;
    let record = this.originalLines[rowIndex];
    const recordIndex = this.originalLines.findIndex(x => x.UserId == record.UserId && x.AccessAllCompany);
    if (recordIndex > -1 && recordIndex !== index) {
    } else {
      if (record[this.lineDataConfig.idProp!]) {
        let patchData = {
          Company: record.Company,
          CompanyId: record.CompanyId,
          AccessAllCompany: record.AccessAllCompany
        };
        this.updateLineItemRecord(record, patchData, rowIndex, index);
      } else {
        this.addLineItemRecord(this.utility.getLineControlsData(record, this.lineDataConfig.controls!), rowIndex, index);
      }
    }
  }

  leaveLineControl(data: ControlDataModel, row: number) {
    const itemGroup = this.items.controls[row] as FormGroup;
    const index = itemGroup.get('index')!.value;
    this.lines[row][data.control] = data.data;
    this.originalLines[index][data.control] = data.data;
    if (data.control !== 'Company') {
      if (itemGroup.valid) {
        let record = this.lines[row];
        const lineWithAccessAllCompany = this.lines.filter(x => x.UserId == record.UserId && x.AccessAllCompany)[0];
        if (lineWithAccessAllCompany) {
        } else {
          if (record[this.lineDataConfig.idProp!]) {
            let patchData = {
              [data.control]: data.data
            };
            patchData = this.utility.getLineControlsData(patchData, this.lineDataConfig.controls!);
            this.updateLineItemRecord(record, patchData, row, index);
          } else {
            this.addLineItemRecord(this.utility.getLineControlsData(record, this.lineDataConfig.controls!), row, index);
          }
        }
      }
    }
  }
}
