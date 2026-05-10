import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const PurchaseOrderHeader: HeaderDataConfig = {
  idProp: 'Id',
  api: '/purchaseOrderHeaders',
  title: 'Purchase Order',
  showComments: true,
  commentDocumentType: 'Order',
  commandBar: {
    maxPrimaryActions: 3,
    maxVisibleGroups: 3
  },
  buttons: [

    {
      label: 'release',
      name: 'Release',
      icon: 'bi bi-arrow-repeat', // Better match for "release" or cycle
      group: 'Process',
      isPrimary: true,
      order: 10
    },
    {
      label: 'reopen',
      name: 'Re-Open',
      icon: 'bi bi-box-arrow-in-right', // Represents reopening or returning
      group: 'Process',
      order: 20
    },
    {
      label: 'prepayment',
      name: 'Pre payment',
      icon: 'bi bi-credit-card', // Best fit for payments
      group: 'Process',
      order: 30
    },
    {
      label: 'SendApprovalRequest',
      name: 'Send Approval Request',
      icon: 'bi bi-send', // Represents sending
      group: 'Approval',
      isPrimary: true,
      order: 40
    },
    {
      label: 'CancelApprovalRequest',
      name: 'Cancel Approval Request',
      icon: 'bi bi-x-circle', // Clearly indicates cancel
      group: 'Approval',
      order: 50
    },
    {
      label: 'GRNReview',
      name: 'GRN Review',
      icon: 'bi bi-file-earmark-check', // Review/checking document
      group: 'Review',
      order: 60
    },
    {
      label: 'CancelGRNReview',
      name: 'Cancel GRN Review',
      icon: 'bi bi-file-earmark-x', // Cancel/reject document
      group: 'Review',
      order: 70
    },
    {
      label: 'InvoiceReview',
      name: 'Invoice Review',
      icon: 'bi bi-receipt', // Represents invoices/receipts
      group: 'Review',
      order: 80
    },
    {
      label: 'CancelInvoiceReview',
      name: 'Cancel Invoice Review',
      icon: 'bi bi-x-square', // Canceling or rejecting something
      group: 'Review',
      order: 90
    },
    {
      label: 'Post',
      name: 'Post',
      icon: 'bi bi-cloud-upload', // Posting/uploading
      group: 'Process',
      isPrimary: true,
      order: 100
    },
    {
      label: 'ConverttoVariationOrder',
      name: 'Convert to Variation Order',
      icon: 'bi bi-arrow-left-right', // Represents conversion/transfer
      group: 'Process',
      order: 110
    },
    {
      label: 'manualPOCancel',
      name: 'Manual PO Cancel',
      icon: 'bi bi-ban', // Strong cancel/ban icon
      group: 'More',
      order: 120
    },
    {
      label: 'SubmitWorkflow',
      name: 'Submit Workflow',
      icon: 'bi bi-send',
      group: 'Approval',
      order: 130
    },
    {
      label: 'CancelWorkflow',
      name: 'Cancel Workflow',
      icon: 'bi bi-x-circle',
      group: 'Approval',
      order: 140
    },
    

  ],
  sections: [
    {
      title: 'General Information',
      autoPack: true,
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'Number',
            name: 'No',
            required: true,
            readonly: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'DueDate',
            name: 'DueDate',
            dateOnly: true,
            defaultSystemDate: true,
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'BuyFromVendorNumber',
            name: 'Vendor No',
            readonly: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'OrderDate',
            name: 'Order Date',
            dateOnly: true,
            defaultSystemDate: true,
            readonly: true
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
            type: FormFieldType.DateTime,
            label: 'RequestedReceiptDate',
            name: 'Requested Receipt Date',
            dateOnly: true,
            defaultSystemDate: true,
            readonly: true
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
            label: 'BuyFromCountryOrRegionCode',
            name: 'Country',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'Status',
            name: 'Status',
            initialValue: 'Open',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'BuyFromPostCode',
            name: 'Post Code',
            readonly: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'DocumentDate',
            name: 'Document Date',
            dateOnly: true,
            defaultSystemDate: true
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
            label: 'OrderNumber',
            name: 'Order No',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.PhoneNumber,
            label: 'BuyFromContactNumber',
            name: 'Contact No',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'VendorOrderNumber',
            name: 'Vendor Order No'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'VendorInvoiceNumber',
            name: 'Vendor Invoice No'
          },
          {
            type: FormFieldType.TextBox,
            label: 'VendorShipmentNumber',
            name: 'Vendor Shipment No'
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'QuoteNumber',
            name: 'Quote No',
            readonly: true
          }
        ]
      ]
    },
    {
      title: 'Financial & Delivery Info',
      autoPack: true,
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
            type: FormFieldType.DropDown,
            label: 'PaymentTermsCode',
            name: 'Payment Terms Code',
            apiUrl: '/paymentTerms',
            bindValue: 'Code',
            displayFormat: '[Code]-[Description]'
          }
        ],
        [
          {
            type: FormFieldType.DateTime,
            label: 'ValidityDate',
            name: 'Validity Date',
            dateOnly: true,
            defaultSystemDate: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'DeliveryDate',
            name: 'Delivery Date',
            dateOnly: true,
            defaultSystemDate: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'YourReference',
            name: 'Your Reference'
          },
          {
            type: FormFieldType.TextBox,
            label: 'PaymentReference',
            name: 'Payment Reference'
          }
        ]
      ]
    },
    {
      title: 'Review Status',
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'GRNReviewStatus',
            name: 'GRN Review Status',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'InvoiceReviewStatus',
            name: 'Invoice Review Status',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'GRNReviewerComment',
            name: 'GRN Reviewer Comment',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'InvoiceReviewerComment',
            name: 'Invoice Reviewer Comment',
            readonly: true
          }
        ]
      ]
    },
    {
      title: 'Remarks & Approvals',
      controls: [
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
            label: 'PostingDate',
            name: 'Posting Date',
            dateOnly: true,
            defaultSystemDate: true
          }
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'ApproverGroup',
            name: 'Approver Group',
            apiUrl: '/approvalGroups',
            bindLabel: 'Description',
            bindValue: 'Code'
          },
          {
            type: FormFieldType.Number,
            label: 'Prepayment',
            name: 'Pre payment %',
            decimal: true
          }
        ]
      ]
    }
  ],
  removeUnicodeCharFields: ['Status']
};

PurchaseOrderHeader.controls = (PurchaseOrderHeader.sections ?? []).flatMap(section => section.controls);


export const PurchaseOrderLine: LineDataConfig = {
  idProp: 'Id',
  headerPKProp: 'Number',
  lineFKProp: 'DocumentNo',
  api: '/purchaseOrderLines',
  showCreate: false,
  showDelete: false,
  defaultLines: 0,
  // disableLine: true,
  apiPatchProperties: [
    "AmountToInvoice",
    "AmountInvoiced",
    "DirectUnitCost",
    "LineAmount",
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
      bindValue: 'value'
    },
    {
      type: FormFieldType.DropDown,
      label: 'No',
      name: 'Number',
      disabled: true
    },
    {
      type: FormFieldType.TextBox,
      label: 'Description',
      name: 'Description',
      isDescription: true,
      maxlength: 100
    },
    {
      type: FormFieldType.DropDown,
      // label: 'UnitOfMeasureCode',
      label: 'UnitOfMeasure',
      name: 'Unit Of Measure',
      apiUrl: '/unitOfMeasures',
      bindValue: 'Code',
      displayFormat: '[Code] - [Description]'
    },
    {
      type: FormFieldType.DropDown,
      label: 'LocationCode',
      name: 'Location',
      apiUrl: '/locations',
      bindValue: 'Code',
      displayFormat: '[Code] - [Name]'
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
      name: 'Unit Price',
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
      label: 'QtyToReceive',
      name: 'Qty. to Receive',
      decimal: true
    },
    {
      type: FormFieldType.Number,
      label: 'QuantityReceived',
      name: 'Quantity Received',
      decimal: true,
      readonly: true,
    },
    {
      type: FormFieldType.Number,
      label: 'QtyToInvoice',
      name: 'Qty. to Invoice',
      decimal: true,
      // readonly: true
    },
    {
      type: FormFieldType.Number,
      label: 'QuantityInvoiced',
      name: 'Quantity Invoiced',
      decimal: true,
      readonly: true,
    },
    {
      type: FormFieldType.Number,
      label: 'LineAmount',
      name: 'PO Amount',
      decimal: true,
      readonly: true
    },
    {
      type: FormFieldType.Number,
      label: 'AmountToInvoice',
      name: 'Amount To Invoice',
      decimal: true,
      readonly: true
    },
    {
      type: FormFieldType.Number,
      label: 'AmountInvoiced',
      name: 'Amount Invoiced',
      decimal: true,
      readonly: true
    },

  ],
  removeUnicodeCharFields: ['Type']
}
export const PurchaseOrderCalculation: CalculationSectionConfig = {
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
      },
      {
        type: FormFieldType.Number,
        label: 'totalAmountToInvoice',
        name: 'Total Amount To Invoice',
        readonly: true,
        initialValue: '0.00',
        decimal: true,
        alignRight: true
      },
      {
        type: FormFieldType.Number,
        label: 'totalAmountInvoiced',
        name: 'Total Amount Invoiced',
        readonly: true,
        initialValue: '0.00',
        decimal: true,
        alignRight: true
      }

    ]
  ]
}
