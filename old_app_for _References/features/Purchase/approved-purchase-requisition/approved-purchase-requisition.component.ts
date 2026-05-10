import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';


import { ApprovedPurchaseRequisitionHeader, ApprovedPurchaseRequisitionLine } from './approved-purchase-requisition.config';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Utility } from '../../../core/services/utility.service';
import { SessionService } from '../../../core/services/session.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-approved-purchase-requisition',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class ApprovedPurchaseRequisitionComponent {

  config: DataTableConfig = {
    title: 'Approved Purchase Requisition',
    idProp: 'Id',
    headerApi: '/purchaseRequisitionHeaders',
    pageName: 'APR',
    headerApiOrderByField: 'Number',
    filters: [
      {
        field: 'ApprovalStatus',
        operator: 'eq',
        value: "'Approved'"
      },
      {
        field: 'ApprovalStatus',
        operator: 'ne',
        value: "'Archived'"
      },
      {
        field: 'DocumentType',
        operator: 'eq',
        value: "'Requisition'"
      },
      {
        field: 'ManualPRCancel',
        operator: 'eq',
        value: 'false'
      }
    ],
    filterByUserCompanyResCenter: true,
    showDelete: false,
    showCreate: false,
    headers: [{
      name: 'Number',
      prop: 'Number',
      isPrimaryLink: true
    }, {
      name: 'Requisition Date',
      prop: 'RequisitionDate'
    }, {
      name: 'Document Type',
      prop: 'DocumentType'
    }, {
      name: 'Approval Status',
      prop: 'ApprovalStatus'
    },
    {
      name: 'Remark',
      prop: 'Remark',
    }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Approved Purchase Requisition',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: ApprovedPurchaseRequisitionHeader,
      lineConfig: ApprovedPurchaseRequisitionLine,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Requisition',
        documentStatusProp: 'ApprovalStatus',
        informationDetailSecctionType: InformationDetailSecctionType.ApprovedPurchaseRequsition
      }
    }
  };
 
  MenuButtons: Menubuttons[] = [
    {
      label: 'Purchase Requisition',
      name: 'Purchase Requisition',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/requisition'
    },
    {
      label: 'Approved Purchase Requisition',
      name: 'Approved Purchase Requisition',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/approved-pr',
      isEnable: false
    },
    {
      label: 'Archived Purchase Requisition',
      name: 'Archived Purchase Requisition',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/archived-requisition'
    },
    {
      label: 'Purchase Requisition Cancelled',
      name: 'Purchase Requisition Cancelled',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/cancelled-pr'
    },
  ];
  GLNodroparray: any[] = [];
  LNData: any[] = [];
  HDData: any;
  chartAccountData: any[] = [];

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private utility: Utility,
    private sessionService: SessionService,
    private emailNotifyService: EmailNotifyService,
  ) {
  }

  popupLoaded(data: any) {
    this.addItemService.enableOrDisableAllControls$.next(false);
  }

  manualPRCancel(buttonData: CustomButtonEvent) {
    if (buttonData.headerData.ManualPRCancel) {
      this.toastr.warning('This Purchase Requisition is already cancelled');
    } else {
      this.cancelPRCancel(buttonData.headerData);
    }
  }

  cancelPRCancel(headerData: any) {
    const patchData = {
      ManualPRCancel: true,
      PurReqCancelUserID: this.sessionService.UserId
    };
    const ifMatchKey = "*"; // this.headerData["@odata.etag"];
    this.addItemService.showLoader$.next(true);
    this.restService.patch(this.config.addItemConfig!.headerConfig!.api! + '(' + headerData[this.config.addItemConfig!.headerConfig!.idProp!] + ')', patchData, ifMatchKey).subscribe((response: any) => {
      this.toastr.success('Purchase Requisition has cancelled');
      this.addItemService.showLoader$.next(false);
      this.addItemService.closePopup$.next(true);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label === 'manualPRCancel') {
      this.manualPRCancel(buttonData);
    }
  }
}
