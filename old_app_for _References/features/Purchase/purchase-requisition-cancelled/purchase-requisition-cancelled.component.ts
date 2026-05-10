import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { PurchaseRequisitionCancelledHeader, PurchaseRequisitionCancelledLine } from './purchase-requisition-cancelled.config';
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
  selector: 'app-purchase-requisition-cancelled',
  template: '<app-data-table [config]="config" [MenuButtons]="MenuButtons" (popupLoaded)="popupLoaded($event)"></app-data-table>'
})
export class PurchaseRequisitionCancelledComponent {

  config: DataTableConfig = {
    title: 'Purchase Requisition Cancelled',
    idProp: 'Id',
    headerApi: '/purchaseRequisitionHeaders',
    pageName: 'PRC',
    headerApiOrderByField: 'Number',
    filters: [
      {
        field: 'DocumentType',
        operator: 'eq',
        value: "'Requisition'"
      },
      {
        field: 'ManualPRCancel',
        operator: 'eq',
        value: 'true'
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
    }, {
      name: 'Pur Req Cancel User ID',
      prop: 'PurReqCancelUserID'
    },
    {
      name: 'Remark',
      prop: 'Remark',
    }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Purchase Requisition Cancelled',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: PurchaseRequisitionCancelledHeader,
      lineConfig: PurchaseRequisitionCancelledLine,
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
      route: '/purchase/requisition',
    },
    {
      label: 'Approved Purchase Requisition',
      name: 'Approved Purchase Requisition',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/approved-pr'
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
      route: '/purchase/cancelled-pr',
      isEnable: false
    },
  ]
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

}
