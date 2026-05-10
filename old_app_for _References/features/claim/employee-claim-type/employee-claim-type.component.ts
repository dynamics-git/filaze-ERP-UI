import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';
import { RestService } from '../../../core/services/rest.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { Utility } from '../../../core/services/utility.service';
import { LineWorkspacePageBase } from '../../../shared/components/line-workspace/line-workspace-page.base';
import { LINE_WORKSPACE_PAGE_TEMPLATE } from '../../../shared/components/line-workspace/line-workspace-page.template';
import { EmployeeClaimTypeLineConfig } from './employee-claim-type.config';

@Component({
  standalone: false,
  selector: 'app-employee-claim-type',
  template: LINE_WORKSPACE_PAGE_TEMPLATE
})
export class EmployeeClaimTypeComponent extends LineWorkspacePageBase implements OnInit {

  protected lineDataConfig: LineDataConfig = EmployeeClaimTypeLineConfig;

  constructor(
    fb: FormBuilder,
    toastr: ToastrService,
    restService: RestService,
    utility: Utility,
    dialogService: UnifiedDialogService,
    cdr: ChangeDetectorRef,
    zone: NgZone
  ) {
    super(fb, toastr, restService, utility, dialogService, cdr, zone);
  }

  changeLineControl(_data: ControlDataModel, _rowIndex: number): void { }

  leaveLineControl(data: ControlDataModel, row: number): void {
    const itemGroup = this.items.controls[row] as FormGroup;
    const index = itemGroup.get('index')!.value;
    this.lines[row][data.control] = data.data;
    this.originalLines[index][data.control] = data.data;
    const record = this.lines[row];
    if (record[this.lineDataConfig.idProp!]) {
      this.updateLineItemRecord(record, { [data.control]: data.data }, row, index);
    } else {
      if (itemGroup.valid) {
        this.addLineItemRecord(record, row, index);
      }
    }
  }
}

