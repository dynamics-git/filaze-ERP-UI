import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";


export const SalesInvoiveHeader: HeaderDataConfig = {
  idProp: 'Id',
  api: '/salesHeaders',
  title: 'Sales Invoice',
  autoGenerateField: 'Number',
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
      label: 'Post',
      name: 'Post As Invoice',
      icon: 'bi bi-save'
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
      title: 'Customer Information',
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'Number',
            name: 'Number',
            required: true,
            readonly: true
          },
          {
            type: FormFieldType.DropDown,
            label: 'SellToCustomerNo',
            name: 'Customer No',
            apiUrl: '/Customers',
            bindValue: 'No',
            displayFormat: '[No] - [Name]'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'SellToCustomerName',
            name: 'Name',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'SellToCountryRegionCode',
            name: 'Country/Region Code',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'SellToAddress',
            name: 'Address',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'SellToCity',
            name: 'City',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'SellToAddress2',
            name: 'Address 2',
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
            label: 'SellToCity',
            name: 'City',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'SellToPostCode',
            name: 'Post Code',
            readonly: true
          }
        ]
      ]
    },
    {
      title: 'Document Dates',
      controls: [
        [
          {
            type: FormFieldType.DateTime,
            label: 'DocumentDate',
            name: 'Document Date',
            dateOnly: true,
            defaultSystemDate: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'PostingDate',
            name: 'Posting Date',
            dateOnly: true,
            defaultSystemDate: true
          }
        ],
        [
          {
            type: FormFieldType.DateTime,
            label: 'ShipmentDate',
            name: 'Shipment Date',
            dateOnly: true,
            defaultSystemDate: true
          },
          {
            type: FormFieldType.DropDown,
            label: 'ShortcutDimension2Code',
            name: 'DEPARTMENT/COST CNTR'
          }
        ]
      ]
    },
    {
      title: 'Sales Information',
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'ExternalDocumentNo',
            name: 'External DocumentNo'
          },
          {
            type: FormFieldType.DropDown,
            label: 'SalespersonCode',
            name: 'Salesperson Code',
            apiUrl: '/salespersonPurchasers',
            bindValue: 'Code',
            displayFormat: '[Code] - [Name]'
          }
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'ShortcutDimension1Code',
            name: 'PROJECT'
          },
          {
            type: FormFieldType.TextArea,
            label: 'Remark',
            name: 'Remark',
            isDescription: true,
            maxlength: 100
          }
        ]
      ]
    },
    {
      title: 'Approval Info',
      controls: [
        [
          {
            type: FormFieldType.TextArea,
            label: 'PendingApproversID',
            name: 'Pending Approvers ID',
            readonly: true
          },
          {
            type: FormFieldType.TextArea,
            label: 'RejectReason',
            name: 'Approvers Comments',
            disabled: true
          }
        ]
      ]
    }
  ],
  removeUnicodeCharFields: ['Status']
};
SalesInvoiveHeader.controls = (SalesInvoiveHeader.sections ?? []).flatMap(section => section.controls);

export const SalesInvoiceLine: LineDataConfig = {
  idProp: 'Id',
  headerPKProp: 'Number',
  lineFKProp: 'DocumentNo',
  api: '/salesLines',
  includeHeaderId: true,
  showDelete: true,
  showCreate: true,
  defaultLines: 3,
  apiPatchProperties: [
    "AmountLCY",
    "LineAmount",
    "CurrencyCode",
  ],
  controls: [
    {
      type: FormFieldType.DropDown,
      label: 'documentType',
      name: 'Documeny Type',
      initialValue: 'Invoice',
      items: [{
        value: 'Invoice',
        name: 'Invoice'
      }],
      bindLabel: 'name',
      bindValue: 'value'
    },
    {
      type: FormFieldType.DropDown,
      label: 'Type',
      name: 'Type',
      items: [{
        value: 'G/L Account',
        name: 'G/L Account'
      },
      {
        value: ' ',
        name: 'Comment'
      }],
      bindLabel: 'name',
      bindValue: 'value',
      required: true
    },
    {
      type: FormFieldType.DropDown,
      label: 'No',
      name: 'No',
      disabled: true,
      required: true,
      autoSave: false
    },
    {
      type: FormFieldType.TextBox,
      label: 'Description',
      name: 'Description',
      isDescription: true,
      maxlength: 100
      // required: true
    },
    {
      type: FormFieldType.DropDown,
      label: 'UnitOfMeasureCode',
      name: 'Unit Of Measure',
      apiUrl: '/unitOfMeasures',
      bindValue: 'Code',
      displayFormat: '[Code] - [Description]',
      // required: true
    },
    {
      type: FormFieldType.DropDown,
      label: 'LocationCode',
      name: 'Location',
      apiUrl: '/locations',
      bindValue: 'Code',
      displayFormat: '[Code] - [Name]',
      // required: true
    },
    {
      type: FormFieldType.Number,
      label: 'Quantity',
      name: 'Quantity',
      decimal: true,
      // required: true
    },
    {
      type: FormFieldType.Number,
      label: 'UnitPrice',
      name: 'Unit Price Excl. VAT',
      decimal: true,
      // required: true
    },
    {
      type: FormFieldType.Number,
      label: 'LineAmount',
      name: 'Line Amount Excl. VAT',
      decimal: true,
      // required: true,
      readonly: true
    },
    {
      type: FormFieldType.TextBox,
      label: 'CurrencyCode',
      name: 'CurrencyCode',
      readonly: true,
      disabled: true,
      // required: true,
    },
    {
      type: FormFieldType.Number,
      label: 'AmountLCY',
      name: 'Amount LCY',
      decimal: true,
      readonly: true,
      disabled: true,
      // required: true,
    },

  ],
  removeUnicodeCharFields: ['Type']
}
export const SalesInvoicecalculation: CalculationSectionConfig = {
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