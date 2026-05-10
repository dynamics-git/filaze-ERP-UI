import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { HeaderDataConfig } from '../../../core/models/shared/header-data.config';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';

export const ExpenseTypeHeaderConfig: HeaderDataConfig = {
  idProp: 'systemId',
  api: '/expenseClaimTypes',
  title: 'Expense Type',
  patchUserId: false,
  sections: [
    {
      title: 'General Setup',
      controls: [
        [
          {
            type: FormFieldType.DropDown,
            label: 'code',
            name: 'Code',
            apiUrl: '/employeeClaimTypes',
            bindValue: 'code',
            displayFormat: '[code]',
            required: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'description',
            name: 'Description'
          }
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'limitType',
            name: 'Limit Type',
            items: [
              { value: 'KM', name: 'KM' },
              { value: 'Days', name: 'Days' },
              { value: 'Amount', name: 'Amount' }
            ],
            bindLabel: 'name',
            bindValue: 'value',
            required: true
          },
          {
            type: FormFieldType.Number,
            label: 'limitValue',
            name: 'Limit Value',
            decimal: true
          }
        ],
        [
          {
            type: FormFieldType.Number,
            label: 'rate',
            name: 'Rate (/KM)',
            decimal: true
          },
          {
            type: FormFieldType.Number,
            label: 'motorcycleRate',
            name: 'Motorcycle Rate',
            decimal: true
          }
        ],
        [
          {
            type: FormFieldType.Number,
            label: 'vehicleRate',
            name: 'Car Rate',
            decimal: true
          },
          {
            type: FormFieldType.DropDown,
            label: 'vatCode',
            name: 'VAT Code',
            apiUrl: '/vatProdPostingGroups',
            bindValue: 'code',
            displayFormat: '[code]'
          }
        ],
        [
          {
            type: FormFieldType.Number,
            label: 'vat',
            name: 'VAT %',
            readonly: true,
            decimal: true
          },
          {
            type: FormFieldType.Checkbox,
            label: 'active',
            name: 'Active'
          }
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'expenseGLAcc',
            name: 'Expense G/L Account',
            apiUrl: '/glAccountClaimEntries',
            bindValue: 'No',
            displayFormat: '[No] - [Name]'
          },
          {
            type: FormFieldType.DropDown,
            label: 'payableAccountNo',
            name: 'Payable Account No.',
            apiUrl: '/glAccountClaimEntries',
            bindValue: 'No',
            displayFormat: '[No] - [Name]'
          }
        ]
      ]
    }
  ]
};

ExpenseTypeHeaderConfig.controls =
  (ExpenseTypeHeaderConfig.sections ?? []).flatMap(
    section => section.controls
  );


export const ExpensesTypeLime: LineDataConfig = {
  idProp: 'systemId',
  headerPKProp: 'code',
  lineFKProp: 'expenseType',
  api: '/expTypeConfigs',
  includeHeaderId: true,
  defaultLines: 1,
  buttons: [
    {
      label: 'fieldPermission',
      name: 'Filed Permission',
      icon: 'bi bi-shield-check'
    },
  ],
  controls: [

    {
      type: FormFieldType.TextBox,
      label: 'expenseType',
      name: 'Expense Type',
      readonly: true,
      required: true,
    },
    {
      type: FormFieldType.TextBox,
      label: 'fieldName',
      name: 'Field Name',
      required: true,
      readonly: true,
    },
    {
      type: FormFieldType.Checkbox,
      label: 'isVisible',
      name: 'Visible',
    },
    // {
    //   type: FormFieldType.Checkbox,
    //   label: 'isRequired',
    //   name: 'Required',
    // },
  ],
}

