import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { HeaderDataConfig } from '../../../core/models/shared/header-data.config';

export const ClaimRuleConfig: HeaderDataConfig = {
  idProp: 'systemId',
  api: '/ClaimRuleSetups',
  title: 'Claim Rule',
  patchUserId: false,
  buttons: [
     {
            label: 'managePaxLimit',
            name: 'Manage Pax Limit',
            icon: 'bi bi-gear' // Represents action of managing
        },
         {
            label: 'ResetPaxLimit',
            name: 'Reset Pax Limit',
            icon: 'bi bi-arrow-clockwise' // Represents action of resetting
        },
  ],
  sections: [
    {
      title: 'General Setup',
      controls: [
        [
          {
            type: FormFieldType.DropDown,
            label: 'claimTypeCode',
            name: 'Code',
            apiUrl: '/expenseClaimTypes',
            bindValue: 'code',
            displayFormat: '[code]',
            required: true
          },
          {
            type: FormFieldType.DropDown,
            label: 'conditionType',
            name: 'Condition Type',
            items: [
              { value: 'Group-Based', name: 'Group-Based' },
              { value: 'Role-Based', name: 'Role-Based' },
              { value: 'Employee-Based', name: 'Employee-Based' },
              { value: 'Department-Based', name: 'Department-Based' }
            ],
            bindLabel: 'name',
            bindValue: 'value',
            required: true
          }
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'applicableToID',
            name: 'Applicable To'
          },
          {
            type: FormFieldType.DropDown,
            label: 'entitlementCode',
            name: 'Entitlement Code',
            apiUrl: '/entitlements',
            bindValue: 'code',
            displayFormat: '[code]'
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
            label: 'currencyCode',
            name: 'Currency Code',
            apiUrl: '/currencyCodes',
            bindValue: 'Code',
            displayFormat: '[Code]'
          }
        ],
        [
          {
            type: FormFieldType.Checkbox,
            label: 'allowOverseas',
            name: 'Allow Overseas'
          },
          {
            type: FormFieldType.Checkbox,
            label: 'attachmentRequired',
            name: 'Attachment Required'
          }
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'chargeableOption',
            name: 'Chargeable',
            items: [
              { value: 'Yes', name: 'Yes' },
              { value: 'No', name: 'No' },
              { value: 'Optional', name: 'Optional' }
            ],
            bindLabel: 'name',
            bindValue: 'value'
          },
          {
            type: FormFieldType.DropDown,
            label: 'status',
            name: 'Status',
            items: [
              { value: 'Active', name: 'Active' },
              { value: 'Inactive', name: 'Inactive' }
            ],
            bindLabel: 'name',
            bindValue: 'value'
          }
        ],
        [{
          type: FormFieldType.Checkbox,
          label: 'enablePAX',
          name: 'Enable PAX',
          readonly:true
        }, {
          type: FormFieldType.Number,
          label: 'paxLimit',
          name: 'PAX Limit',
          decimal: true,
          readonly:true
        },]
      ]
    }
  ]
};

ClaimRuleConfig.controls = (ClaimRuleConfig.sections ?? []).flatMap(section => section.controls);
