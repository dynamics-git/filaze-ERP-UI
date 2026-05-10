import { ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';
import { RestService } from '../../../core/services/rest.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { Utility } from '../../../core/services/utility.service';
import { LineWorkspacePageBase } from '../line-workspace/line-workspace-page.base';

@Component({
  standalone: false,
  selector: 'app-setup-line-modal',
  templateUrl: './setup-line-modal.component.html',
  styleUrls: ['./setup-line-modal.component.scss']
})
export class SetupLineModalComponent extends LineWorkspacePageBase implements OnInit {

  @Input() lineDataConfig: LineDataConfig = {};
  isMaximized = false;

  constructor(
    public activeModal: NgbActiveModal,
    private el: ElementRef,
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

  toggleMaximize(): void {
    this.isMaximized = !this.isMaximized;
    const dialog = this.el.nativeElement.closest('.modal-dialog');
    if (dialog) {
      dialog.classList.toggle('modal-xl', this.isMaximized);
      dialog.classList.toggle('modal-lg', !this.isMaximized);
    }
  }

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
