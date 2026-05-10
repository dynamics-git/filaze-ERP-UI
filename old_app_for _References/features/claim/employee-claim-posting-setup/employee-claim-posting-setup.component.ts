import { Component } from '@angular/core';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { EmployeeClaimPostingSetupHeaderConfig } from './employee-claim-posting-setup.config';

@Component({
  standalone: false,
  selector: 'app-employee-claim-posting-setup',
  template: '<app-data-table [config]="config"  [MenuButtons]="MenuButtons"></app-data-table>',
})
export class EmployeeClaimPostingSetupComponent {
  config: DataTableConfig = {
    title: 'Employee Claim Posting Setup',
    idProp: 'systemId',
    headerApi: '/claimPostingSetups',
    pageName: 'EMP_CLAIM_POST_SETUP',
    headers: [
      { name: 'Expense Type', prop: 'expenseType', isPrimaryLink: true },
      { name: 'Expense G/L Account', prop: 'expenseGLAccount' },
      { name: 'Payable Account Type', prop: 'payableAccountType' },
      { name: 'Active', prop: 'active', isBoolean: true }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Employee Claim Posting Setup',
      recordId: 'expenseType',
      recordTitle: 'expenseType',
      headerConfig: EmployeeClaimPostingSetupHeaderConfig
    }
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Rule Settings',
      name: 'Rule Settings',
      icon: 'bi bi-lightbulb',
      route: '/claimSetupHome/ruleSetup',
    },
    {
      label: 'Update Setup',
      name: 'Update Setup',
      icon: 'bi bi-lightbulb',

    },
  ]

}
