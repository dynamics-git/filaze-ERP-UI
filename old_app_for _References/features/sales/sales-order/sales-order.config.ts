import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const SalesOrderHeader: HeaderDataConfig = {
  idProp: 'systemId',
  api: '/salesOrderHeaders',
  title: 'Sales Order',
  autoGenerateField: 'Number',
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
            label: 'sellToCustomerNo',
            name: 'Customer No',
            apiUrl: '/Customers',
            bindValue: 'No',
            displayFormat: '[No] - [Name]'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'sellToCustomerName',
            name: 'Customer Name',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'status',
            name: 'Status',
            initialValue: 'Open',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'sellToAddress',
            name: 'Address',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'sellToCity',
            name: 'City',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'sellToCountryRegionCode',
            name: 'Country/Region Code',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'sellToPostCode',
            name: 'Post Code',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'sellToContact',
            name: 'Contact',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'sellToPhoneNo',
            name: 'Phone No',
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
            label: 'documentDate',
            name: 'Document Date',
            dateOnly: true,
            defaultSystemDate: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'postingDate',
            name: 'Posting Date',
            dateOnly: true,
            defaultSystemDate: true
          }
        ],
        [
          {
            type: FormFieldType.DateTime,
            label: 'orderDate',
            name: 'Order Date',
            dateOnly: true,
            defaultSystemDate: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'dueDate',
            name: 'Due Date',
            dateOnly: true,
            defaultSystemDate: true
          }
        ],
        [
          {
            type: FormFieldType.DateTime,
            label: 'shipmentDate',
            name: 'Shipment Date',
            dateOnly: true,
            defaultSystemDate: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'requestedDeliveryDate',
            name: 'Requested Delivery Date',
            dateOnly: true,
            defaultSystemDate: true
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
            label: 'externalDocumentNo',
            name: 'External Document No'
          },
          {
            type: FormFieldType.DropDown,
            label: 'salespersonCode',
            name: 'Salesperson Code',
            apiUrl: '/salespersonPurchasers',
            bindValue: 'Code',
            displayFormat: '[Code] - [Name]'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'paymentTermsCode',
            name: 'Payment Terms Code',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'currencyCode',
            name: 'Currency Code',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextArea,
            label: 'remark',
            name: 'Remark',
            isDescription: true,
            maxlength: 100
          },
          {
            type: FormFieldType.TextBox,
            label: 'yourReference',
            name: 'Your Reference'
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
            label: 'pendingApproversID',
            name: 'Pending Approvers ID',
            readonly: true
          },
          {
            type: FormFieldType.TextArea,
            label: 'rejectReason',
            name: 'Approvers Comments',
            readonly: true
          }
        ]
      ]
    }
  ],
  removeUnicodeCharFields: ['status']
};

SalesOrderHeader.controls = (SalesOrderHeader.sections ?? []).flatMap(section => section.controls);

export const SalesOrderLine: LineDataConfig = {
  idProp: 'systemId',
  headerPKProp: 'Number',
  lineFKProp: 'documentNo',
  api: '/salesOrderLines',
  includeHeaderId: true,
  showDelete: true,
  showCreate: true,
  defaultLines: 3,
  apiPatchProperties: [
    'amount',
    'lineAmount',
    'unitCost',
  ],
  controls: [
    {
      type: FormFieldType.DropDown,
      label: 'documentType',
      name: 'Document Type',
      initialValue: 'Order',
      items: [
        {
          value: 'Order',
          name: 'Order'
        }
      ],
      bindLabel: 'name',
      bindValue: 'value'
    },
    {
      type: FormFieldType.DropDown,
      label: 'type',
      name: 'Type',
      items: [
        {
          value: 'G/L Account',
          name: 'G/L Account'
        },
        {
          value: ' ',
          name: 'Comment'
        }
      ],
      bindLabel: 'name',
      bindValue: 'value',
      required: true
    },
    {
      type: FormFieldType.DropDown,
      label: 'no',
      name: 'No',
      disabled: true,
      required: true,
      autoSave: false
    },
    {
      type: FormFieldType.TextBox,
      label: 'description',
      name: 'Description',
      isDescription: true,
      maxlength: 100
    },
    {
      type: FormFieldType.DropDown,
      label: 'unitOfMeasureCode',
      name: 'Unit Of Measure',
      apiUrl: '/unitOfMeasures',
      bindValue: 'Code',
      displayFormat: '[Code] - [Description]'
    },
    {
      type: FormFieldType.DropDown,
      label: 'locationCode',
      name: 'Location',
      apiUrl: '/locations',
      bindValue: 'Code',
      displayFormat: '[Code] - [Name]'
    },
    {
      type: FormFieldType.Number,
      label: 'quantity',
      name: 'Quantity',
      decimal: true
    },
    {
      type: FormFieldType.Number,
      label: 'unitPrice',
      name: 'Unit Price',
      decimal: true
    },
    {
      type: FormFieldType.Number,
      label: 'lineAmount',
      name: 'Line Amount',
      decimal: true,
      readonly: true
    },
    {
      type: FormFieldType.Number,
      label: 'unitCost',
      name: 'Unit Cost',
      decimal: true,
      readonly: true,
      disabled: true
    },
    {
      type: FormFieldType.Number,
      label: 'amount',
      name: 'Amount',
      decimal: true,
      readonly: true,
      disabled: true
    }
  ],
  removeUnicodeCharFields: ['type']
};

export const SalesOrderCalculation: CalculationSectionConfig = {
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
};
