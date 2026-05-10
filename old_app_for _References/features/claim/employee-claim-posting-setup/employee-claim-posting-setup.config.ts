import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { HeaderDataConfig } from '../../../core/models/shared/header-data.config';

export const EmployeeClaimPostingSetupHeaderConfig: HeaderDataConfig = {
  idProp: 'systemId',
  api: '/claimPostingSetups',
  title: 'Employee Claim Posting Setup',
  patchUserId: false,
  sections: [
    {
      title: 'General Setup',
      controls: [
        [
          {
            type: FormFieldType.DropDown,
            label: 'expenseType',
            name: 'Expense Type',
            apiUrl: '/expenseClaimTypes',
            bindLabel: 'code',
            bindValue: 'code',
            required: true
          },
          {
            type: FormFieldType.DropDown,
            label: 'expenseGLAccount',
            name: 'Expense G/L Account',
            apiUrl: '/glAccountClaimEntries',
            bindValue: 'No',
            displayFormat: '[No] - [Name]'
          }
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'payableAccountType',
            name: 'Payable Account Type',
            items: [
              {
                value: 'Employee',
                name: 'Employee'
              }
            ],
            bindLabel: 'name',
            bindValue: 'value'
          },
          {
            type: FormFieldType.DropDown,
            label: 'payableAccountNo',
            name: 'Payable Account No.',
            apiUrl: '/empPostingGroups',
            bindValue: 'code',
            displayFormat: '[code]'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'vatCode',
            name: 'VAT Code'
          },
          {
            type: FormFieldType.Checkbox,
            label: 'jobMandatory',
            name: 'Job Mandatory'
          }
        ],
        [
          {
            type: FormFieldType.Checkbox,
            label: 'active',
            name: 'Active'
          },
        ]
      ]
    }
  ]
};

EmployeeClaimPostingSetupHeaderConfig.controls =
  (EmployeeClaimPostingSetupHeaderConfig.sections ?? []).flatMap(
    section => section.controls
  );
