import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const PurchaseQuoteHeader: HeaderDataConfig = {
  idProp: 'Id',
  api: '/purchaseQuoteHeaders',
  title: 'Purchase Quote',
  buttons: [
    {
      label: 'SendApprovalRequest',
      name: 'Send Approval Request',
      icon: 'bi bi-envelope'
    },
    {
      label: 'CancelApprovalRequest',
      name: 'Cancel Approval Request',
      icon: 'bi bi-envelope'
    },
    {
      label: 'ConvertOrder',
      name: 'Convert Order',
      icon: 'bi bi-layer-forward'
    },
    {
      label: 'ProtalSendApprovalRequest',
      name: 'Portal Send Approval Request',
      icon: 'bi bi-send'
    },
    {
      label: 'PortalCancelApprovalRequest',
      name: 'Portal Cancel Approval Request',
      icon: 'bi bi-x-circle'
    },

  ],
  sections: [
    {
      title: 'General Information',
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'Number',
            name: 'No',
            required: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'DueDate',
            name: 'Due Date'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'BuyFromVendorNumber',
            name: 'Vendor No.',
            readonly: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'OrderDate',
            name: 'Order Date'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'BuyFromVendorName',
            name: 'Vendor Name',
            readonly: true
          },
          {
            type: FormFieldType.DropDown,
            label: 'PurchaserCode',
            name: 'Purchaser Code',
            apiUrl: '/salespersonPurchasers',
            bindValue: 'Code',
            displayFormat: '[Code]-[Name]'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'BuyFromAddress',
            name: 'Address',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'Status',
            name: 'Approval Status',
            initialValue: 'Open',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'BuyFromCountryOrRegionCode',
            name: 'Country',
            readonly: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'DocumentDate',
            name: 'Document Date'
          }
        ]
      ]
    },
    {
      title: 'Location & Contact Details',
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'BuyFromPostCode',
            name: 'Post Code',
            readonly: true
          },
          {
            type: FormFieldType.PhoneNumber,
            label: 'RequisitionNo',
            name: 'Requisition No'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'BuyFromCity',
            name: 'City',
            readonly: true
          },
          {
            type: FormFieldType.PhoneNumber,
            label: 'BuyFromContactNumber',
            name: 'Contact No',
            readonly: true
          }
        ]
      ]
    },
    {
      title: 'Dimensions & Remarks',
      controls: [
        [
          {
            type: FormFieldType.DropDown,
            label: 'ShortcutDimension1Code',
            name: 'PROJECT'
          },
          {
            type: FormFieldType.DropDown,
            label: 'ShortcutDimension2Code',
            name: 'DEPARTMENT/COST CNTR'
          }
        ],
        [
          {
            type: FormFieldType.TextArea,
            label: 'Remark',
            name: 'Remark',
            isDescription: true,
            maxlength: 100
          },
          {
            type: FormFieldType.TextArea,
            label: 'PendingApproversID',
            name: 'Pending Approvers ID',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextArea,
            label: 'RejectReason',
            name: 'Approvers Comments',
            readonly: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'DeliveryDate',
            name: 'Delivery Date',
            dateOnly: true,
            defaultSystemDate: true
          }
        ]
      ]
    }
  ],
  removeUnicodeCharFields: ['Status']
};

PurchaseQuoteHeader.controls = (PurchaseQuoteHeader.sections ?? []).flatMap(section => section.controls);
export const PurchaseQuoteLine: LineDataConfig = {
  idProp: 'Id',
  headerPKProp: 'Number',
  lineFKProp: 'DocumentNo',
  api: '/purchaseQuoteLines',
  showCreate: true,
  showDelete: true,
  apiPatchProperties: [
    "LineAmount",
    "AmountLCY",
    'CurrencyCode',
    "DirectUnitCost",
  ],
  controls: [
    {
      type: FormFieldType.DropDown,
      label: 'Type',
      name: 'Type',
      items: [{
        value: 'G/L Account',
        name: 'G/L Account'
      },
      // {
      //     value: 'Item',
      //     name: 'Item'
      // },{
      //     value: 'Fixed Asset',
      //     name: 'Fixed Asset'
      // },{
      //     value: 'Charge (Item)',
      //     name: 'Charge (Item)'
      // },
      {
        value: ' ',
        name: 'Comment'
      }
      ],
      bindLabel: 'name',
      bindValue: 'value',
      // disabled: true,
      required: true
    },
    {
      type: FormFieldType.DropDown,
      label: 'No',
      name: 'No',
      required: true
      // disabled: true
    },
    {
      type: FormFieldType.TextBox,
      label: 'Description',
      name: 'Description',
      isDescription: true,
      maxlength: 100
      // disabled: true,
    },
    {
      type: FormFieldType.DropDown,
      label: 'UnitOfMeasure',
      name: 'Unit Of Measure',
      apiUrl: '/unitOfMeasures',
      bindValue: 'Code',
      displayFormat: '[Code] - [Description]',
      // disabled: true,
    },
    {
      type: FormFieldType.DropDown,
      label: 'LocationCode',
      name: 'Location',
      apiUrl: '/locations',
      bindValue: 'Code',
      displayFormat: '[Code] - [Name]',
      // disabled: true,
    },
    {
      type: FormFieldType.Number,
      label: 'Quantity',
      name: 'Quantity',
      decimal: true,
    },
    {
      type: FormFieldType.Number,
      label: 'OriginalCost',
      name: 'Original Cost/Unit',
      decimal: true,
    },
    {
      type: FormFieldType.Number,
      label: 'Tax',
      name: 'Tax/Unit',
      decimal: true,
    },
    {
      type: FormFieldType.Number,
      label: 'DirectUnitCost',
      name: 'Unit Cost',
      decimal: true,
      readonly: true,
    },
    {
      type: FormFieldType.Number,
      label: 'LineDiscountAmount',
      name: 'Line Discount Amount',
      decimal: true,
    },
    {
      type: FormFieldType.Number,
      label: 'LineAmount',
      name: 'Amount',
      decimal: true,
      readonly: true,
    },
    {
      type: FormFieldType.Number,
      label: 'AmountLCY',
      name: 'Amount LCY',
      decimal: true,
      readonly: true,
    },
    {
      type: FormFieldType.TextBox,
      label: 'CurrencyCode',
      name: 'Currency Code',
      readonly: true,
    }
    // {
    //     type: FormFieldType.TextBox,
    //     label: 'ShortcutDimension1Code',
    //     name: 'PROJECT'
    // },
    // {
    //     type: FormFieldType.TextBox,
    //     label: 'ShortcutDimension2Code',
    //     name: 'DEPARTMENT/COST CNTR'
    // },
    // {
    //     type: FormFieldType.DropDown,
    //     label: 'ShortcutDimCode3',
    //     name: 'Shortcut Dimension 3'
    // },
    // {
    //     type: FormFieldType.DropDown,
    //     label: 'ShortcutDimCode4',
    //     name: 'Shortcut Dimension 4'
    // },
    // {
    //     type: FormFieldType.DropDown,
    //     label: 'ShortcutDimCode5',
    //     name: 'Shortcut Dimension 5'
    // },
    // {
    //     type: FormFieldType.DropDown,
    //     label: 'ShortcutDimCode6',
    //     name: 'Shortcut Dimension 6'
    // },
    // {
    //     type: FormFieldType.DropDown,
    //     label: 'ShortcutDimCode7',
    //     name: 'Shortcut Dimension 7'
    // },
    // {
    //     type: FormFieldType.DropDown,
    //     label: 'ShortcutDimCode8',
    //     name: 'Shortcut Dimension 8'
    // }
  ],
  removeUnicodeCharFields: ['Type']
}
export const PurchaseQuoteCalculation: CalculationSectionConfig = {
  controls: [
    [
      {
        type: FormFieldType.Number,
        label: 'totalAmount',
        name: 'Total Amount',
        readonly: true,
        initialValue: '0.00',
        decimal: true,
        alignRight: true
      }
    ]
  ]
}