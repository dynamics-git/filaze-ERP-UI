import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { ApproversGroupHeadedr } from './approvers-group.config';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { Utility } from '../../../core/services/utility.service';
import { SessionService } from '../../../core/services/session.service';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-approvers-group',
  template: '<app-data-table [config]="config" [MenuButtons]="MenuButtons"></app-data-table>'

})
export class ApproversGroupComponent {

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private emailNotifyService: EmailNotifyService,
    private utility: Utility,
    private sessionService: SessionService,
  ) {
  }
  config: DataTableConfig = {
    title: "Approvers Group",
    idProp: 'Id',
    headerApi: '/approvalGroups',
    pageName: 'AG',
    headerApiOrderByField: 'Code',
    showCreate: true,
    showEdit: true,
    showDelete: true,
    filterByUserCompanyResCenter: false,
    headers: [
      {
        name: 'Group ID',
        prop: 'Code'
      },
      {
        name: 'Description',
        prop: 'Description'
      },
    ],
    selctionType: 'single',
    addItemConfig: {
      title: "Approver's Group",
      recordId: "Code",
      headerConfig: ApproversGroupHeadedr,
    }
  }
  MenuButtons: Menubuttons[] = [
    {
      label: 'Approval User Setup',
      name: 'Approval User Setup',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/setup',
    },
    {
      label: 'Approvers Group',
      name: 'Approvers Group',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/approversgroup',
      isEnable: false
    },
    {
      label: 'Approval Entries',
      name: 'Approval Entries',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/entry',
    },
    {
      label: 'Document Review User Setup',
      name: 'Document Review User Setup',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/review-user-setup',
    },
    {
      label: 'Review Entries',
      name: 'Review Entries',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/review-entry',
    },
    {
      label: 'Budget Request',
      name: 'Budget Request',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/budget-request',
    },
  ];

}
