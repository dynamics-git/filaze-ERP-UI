import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const ArchivedPurchaseRequisitionHeader: HeaderDataConfig = {
  idProp: 'Id',
  api: '/purchaseRequisitionHeaders',
  title: 'Purchase Requisition',
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
    // {
    //     label: 'DownloadPdf',
    //     name: 'Downlaod Pdf',
    //     icon: 'bi bi-file-pdf'
    // }
    {
      label: 'BidWaiverRequired',
      name: 'Bid Waiver Required',
      icon: 'bi bi-envelope'
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
      title: 'General Info',
      controls: [
        [
          { type: FormFieldType.TextBox, label: 'Number', name: 'Purchase Requisition No', required: true, readonly: true },
          { type: FormFieldType.TextBox, label: 'ApprovalStatus', name: 'Approval Status', initialValue: 'Open', readonly: true, copyResetValue: 'Open' }
        ],
        [
          { type: FormFieldType.DateTime, label: 'RequisitionDate', name: 'Requisition Date', dateOnly: true, defaultSystemDate: true },
          { type: FormFieldType.TextBox, label: 'DocumentType', name: 'Document Type', readonly: true }
        ],
        [
          { type: FormFieldType.DropDown, label: 'BudgetName', name: 'Budget Name', apiUrl: '/glbudgetlists', displayFormat: '[BudgetName] - [description]', bindValue: 'BudgetName' }
        ]
      ]
    },
    {
      title: 'Approval & Delivery',
      controls: [
        [
          { type: FormFieldType.TextArea, label: 'RejectReason', name: 'Approvers Comments', readonly: true, copyResetValue: '' },
          { type: FormFieldType.TextArea, label: 'Remark', name: 'Remark', copyResetValue: '', isDescription: true, maxlength: 100 }
        ],
        [
          { type: FormFieldType.TextArea, label: 'PendingApproversID', name: 'Pending Approvers ID', readonly: true, copyResetValue: '' },
          { type: FormFieldType.DateTime, label: 'DeliveryDate', name: 'Delivery Date', dateOnly: true, defaultSystemDate: true }
        ],
        [
          { type: FormFieldType.TextBox, label: 'purchaseOrderNo', name: 'Purchase Order No', readonly: true },
          { type: FormFieldType.TextBox, label: 'variationOrderNo', name: 'Variation Order No', readonly: true }
        ]
      ]
    }
  ]

};

ArchivedPurchaseRequisitionHeader.controls = (ArchivedPurchaseRequisitionHeader.sections ?? []).flatMap(section => section.controls);


export const ArchivedPurchaseRequisitionLine: LineDataConfig = {
  idProp: 'Id',
  headerPKProp: 'Number',
  lineFKProp: 'PurchaseRequisitionNumber',
  api: '/purchseRequisitionLines',
  includeHeaderId: true,
  disableLine: true,
  controls: [
    {
      type: FormFieldType.DropDown,
      label: 'PurchaseRequisitionType',
      name: 'Type',
      items: [{
        value: 'G/L Account',
        name: 'G/L Account'
      },
      // {
      //     value: 'Item',
      //     name: 'Item'
      // }, {
      //     value: 'Fixed Asset',
      //     name: 'Fixed Asset'
      // }, {
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
      required: true
    },
    {
      type: FormFieldType.DropDown,
      label: 'Number',
      name: 'No',
      required: true
      // disabled: true,   // Amit TSS
      // required: true  //Amit TSS
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
      autoSave: false
    },
    {
      type: FormFieldType.Number,
      label: 'UnitPrice',
      name: 'Unit Cost',
      decimal: true,
      autoSave: false
    },
    {
      type: FormFieldType.Number,
      label: 'Amount',
      name: 'Amount',
      decimal: true,
      readonly: true,
      autoSave: false
    }
  ],
  removeUnicodeCharFields: ['PurchaseRequisitionType']
}

export const ArchivedPurchaseRequisitionCalculation: CalculationSectionConfig = {
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