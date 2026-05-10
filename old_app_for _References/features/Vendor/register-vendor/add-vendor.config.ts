import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";

export const AddVendorConfig: HeaderDataConfig = {
  idProp: 'id',
  api: '/vendorsAPI',
  title: 'Vendor',
  autoGenerateField: 'number',
  // controls: [
  //   [
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'number',
  //       name: 'No',
  //       required: true,
  //       readonly: true
  //     },
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'SearchName',
  //       name: 'Search Name'
  //     },
  //   ],
  //   [
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'displayName',
  //       name: 'Name'
  //     },
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'PurchaserCode',
  //       name: 'Purchaser Code'
  //     }
  //   ],
  //   [
  //     {
  //       type: FormFieldType.Checkbox,
  //       label: 'blocked',
  //       name: 'Blocked'
  //     },
  //     {
  //       type: FormFieldType.Email,
  //       label: 'email',
  //       name: 'Email'
  //     }
  //   ],
  //   [
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'address1',
  //       name: 'Address'
  //     },
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'GenBusPostingGroup',
  //       name: 'Gen Bus Posting Group'
  //     }
  //   ],
  //   [
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'countryLetterCode',
  //       name: 'Country',
  //       parentObjectName: 'address'
  //     },
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'VATBusPostingGroup',
  //       name: 'VAT Bus Posting Group'
  //     }
  //   ],
  //   [
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'postalCode',
  //       name: 'Post Code',
  //       parentObjectName: 'address'
  //     },
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'VendorBusPostingGroup',
  //       name: 'Vendor Posting Group'
  //     }
  //   ],
  //   [
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'city',
  //       name: 'City',
  //       parentObjectName: 'address'
  //     },
  //     {
  //       type: FormFieldType.DateTime,
  //       label: 'DocumentDate',
  //       name: 'Document Date'
  //     }
  //   ],
  //   [
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'Contact',
  //       name: 'Contact No'
  //     },
  //     {
  //       type: FormFieldType.DropDown,
  //       label: 'LocationCode',
  //       name: 'Location Code',
  //       apiUrl: '/locations',
  //       bindValue: 'Code',
  //       displayFormat: '[Code] - [Name]'
  //     }
  //   ],
  //   [
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'PreferredBankAccountCode',
  //       name: 'Preferred Bank Account Code'
  //     },
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'ShipmentMethodCode',
  //       name: 'Shipment Method Code'
  //     }
  //   ],
  //   [
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'ApplicationMethod',
  //       name: 'Application Method'
  //     },
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'PaymentTermsCode',
  //       name: 'Payment Terms Code'
  //     }
  //   ],
  //   [
  //     {
  //       type: FormFieldType.TextBox,
  //       label: 'PaymentMethodCode',
  //       name: 'Payment Method Code'
  //     }
  //   ]
  // ]

  sections: [
    {
      title: 'Vendor Information',
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'number',
            name: 'No',
            required: true,
            // readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'SearchName',
            name: 'Search Name'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'displayName',
            name: 'Name'
          },
          {
            type: FormFieldType.TextBox,
            label: 'PurchaserCode',
            name: 'Purchaser Code'
          }
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'blocked',
            name: 'Blocked',
            items: [{ name: ' ', value: ' ' }, { name: 'Payment', value: 'Payment' }, { name: 'All', value: 'All' }],
            bindLabel: 'name',
            bindValue: 'value'
          },
          {
            type: FormFieldType.Email,
            label: 'email',
            name: 'Email'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'address',
            name: 'Address'
          },
          {
            type: FormFieldType.TextBox,
            label: 'GenBusPostingGroup',
            name: 'Gen Bus Posting Group'
          }
        ],
        [{
          type: FormFieldType.TextBox,
          label: 'address2',
          name: 'Address2'
        },
        // {
        //   type: FormFieldType.TextBox,
        //   label: 'countryLetterCode',
        //   name: 'Country',
        //   parentObjectName: 'address'
        // },
        {
          type: FormFieldType.TextBox,
          label: 'VATBusPostingGroup',
          name: 'VAT Bus Posting Group'
        }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'postCode',
            name: 'Post Code',
          },
          {
            type: FormFieldType.TextBox,
            label: 'VendorBusPostingGroup',
            name: 'Vendor Posting Group'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'city',
            name: 'City',
          },
          {
            type: FormFieldType.DateTime,
            label: 'DocumentDate',
            name: 'Document Date'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'Contact',
            name: 'Contact No'
          },
          {
            type: FormFieldType.DropDown,
            label: 'LocationCode',
            name: 'Location Code',
            apiUrl: '/locations',
            bindValue: 'Code',
            displayFormat: '[Code] - [Name]'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'PreferredBankAccountCode',
            name: 'Preferred Bank Account Code'
          },
          {
            type: FormFieldType.TextBox,
            label: 'ShipmentMethodCode',
            name: 'Shipment Method Code'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'ApplicationMethod',
            name: 'Application Method'
          },
          {
            type: FormFieldType.TextBox,
            label: 'PaymentTermsCode',
            name: 'Payment Terms Code'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'PaymentMethodCode',
            name: 'Payment Method Code'
          }
        ]
      ]
    }
  ]
};
AddVendorConfig.controls = (AddVendorConfig.sections ?? []).flatMap(section => section.controls);