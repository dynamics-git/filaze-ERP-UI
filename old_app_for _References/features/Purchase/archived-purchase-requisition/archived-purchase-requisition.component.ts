import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { ArchivedPurchaseRequisitionCalculation, ArchivedPurchaseRequisitionHeader, ArchivedPurchaseRequisitionLine } from './archived-purchase-requisition.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Utility } from '../../../core/services/utility.service';
import { SessionService } from '../../../core/services/session.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { FactBoxType } from '../../../core/models/shared/fact-box.enum';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-purchase-requisition',
  template: '<app-data-table [config]="config" [MenuButtons]="MenuButtons" (popupLoaded)="popupLoaded($event)"></app-data-table>'
})
export class ArchivedPurchaseRequisitionComponent {

  config: DataTableConfig = {
    title: 'Archived Purchase Requisition',
    idProp: 'Id',
    headerApi: '/purchaseRequisitionHeaders',
    pageName: 'ArchivedPR',
    headerApiOrderByField: 'Number',
    showCreate: false,
    showDelete: false,
    showCopy: true,
    filters: [
      {
        field: 'ApprovalStatus',
        operator: 'eq',
        value: "'Archived'"
      },
    ],
    filterByUserCompanyResCenter: true,
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
      // {
      //   name: 'Pending Approvers ID',
      //   prop: 'PendingApproversID',
      // }
    ],
    selctionType: 'single',
    // showCopy: true,
    addItemConfig: {
      title: 'Purchase Requisition',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: ArchivedPurchaseRequisitionHeader,
      lineConfig: ArchivedPurchaseRequisitionLine,
      calculationSectionConfig: ArchivedPurchaseRequisitionCalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Requisition',
        documentStatusProp: 'ApprovalStatus',
        informationDetailSecctionType: InformationDetailSecctionType.PurchaseRequsition
      }
    },
    factBoxConfig: {
      boxType: FactBoxType.PurchaseRequsition
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
      route: '/purchase/archived-requisition',
      isEnable: false
    },
    {
      label: 'Purchase Requisition Cancelled',
      name: 'Purchase Requisition Cancelled',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/cancelled-pr'
    },
  ];
  chartAccountData: any[] = [];
  itemData: any[] = [];
  fixedAssetData: any[] = [];
  // comments: any[];
  totalAmount: number = 0;

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private sessionService: SessionService,
    private emailNotifyService: EmailNotifyService,
    private utility: Utility) {
  }

  popupLoaded(data: any) {
    if (data.header.ApprovalStatus !== 'Open') {
      this.addItemService.enableOrDisableAllControls$.next(false);
    }

    const lineData = data.line;
    this.totalAmount = 0;
    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.totalAmount += line['Amount'] ? +line['Amount'] : 0;
      });
    };
    this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });

  }
}