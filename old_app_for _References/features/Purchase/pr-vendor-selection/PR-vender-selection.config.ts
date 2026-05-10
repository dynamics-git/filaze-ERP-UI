import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const PRVenderSelectionHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/purchaseRequisitionHeaders',
    title: 'Purchase Requisition Vendor Selection',
    autoGenerateField: 'Number',
    buttons: [
        {
            label: 'ConvertQuote',
            name: 'Convert Quote',
            icon: 'bi bi-layer-forward'
        },
        // {
        //     label: 'manualPRCancel',
        //     name: 'Manual PR Cancel',
        //     icon: 'bi bi-x'
        // },
        // {
        //     label: 'ExportToExcel',
        //     name: 'Export To Excel',
        //     icon: 'bi bi-layer-forward'
        // }
    ],
   sections: [
  {
    title: 'Requisition Summary',
    controls: [
      [
        {
          type: FormFieldType.TextBox,
          label: 'Number',
          name: 'Purchase Requisition No',
          required: true,
          disabled: true
        },
        {
          type: FormFieldType.TextBox,
          label: 'ApprovalStatus',
          name: 'Approval Status',
          initialValue: 'Open',
          readonly: true
        }
      ],
      [
        {
          type: FormFieldType.DateTime,
          label: 'RequisitionDate',
          name: 'Requisition Date',
          dateOnly: true
        },
        {
          type: FormFieldType.Number,
          label: 'PRApprovedAmount',
          name: 'PR Approved Amount LCY',
          decimal: true,
          readonly: true
        }
      ]
    ]
  },
  {
    title: 'Remarks and Reasoning',
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
          label: 'RejectReason',
          name: 'Approvers Comments',
          readonly: true
        }
      ],
      [
        {
          type: FormFieldType.DropDown,
          label: 'Reason',
          name: 'Reason',
          apiUrl: '/portalReasons',
          displayFormat: '[Code] - [Description]',
          bindValue: 'Code'
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
  },
  {
    title: 'Vendor Information',
    controls: [
      [
        {
          type: FormFieldType.DropDown,
          label: 'vendorNo',
          name: 'Vendor No',
          apiUrl: '/vendorsAPI',
          bindValue: 'number',
          displayFormat: '[number] - [displayName]',
          required: true
        },
        {
          type: FormFieldType.TextBox,
          label: 'variationOrderNo',
          name: 'Variation Order No',
          readonly: true
        }
      ]
    ]
  }
]
};
PRVenderSelectionHeader.controls = (PRVenderSelectionHeader.sections ?? []).flatMap(section => section.controls);


export const PRVenderSelectionLine: LineDataConfig = {
    idProp: 'Id',
    headerPKProp: 'Number',
    lineFKProp: 'PurchaseRequisitionNumber',
    api: '/purchseRequisitionLines',
    includeHeaderId: true,
    defaultLines: 0,
    showExcelExport: true,
    buttons: [
        {
            label: 'ConvertQuote',
            name: 'Convert Quote',
            icon: 'bi bi-layer-forward'
        }
    ],
    apiPatchProperties: [
        "AmountLCY",
        // "Amount"
        "CurrencyCode"
    ],
    controls: [
        {
            type: FormFieldType.DropDown,
            label: 'PurchaseRequisitionType',
            name: 'Type',
            items: [{
                value: 'G/L Account',
                name: 'G/L Account'
            // }, {
            //     value: 'Item',
            //     name: 'Item'
            // }, {
            //     value: 'Fixed Asset',
            //     name: 'Fixed Asset'
            // }, {
            //     value: 'Charge (Item)',
            //     name: 'Charge (Item)'
            }, {
                value: ' ',
                name: 'Comment'
            }],
            bindLabel: 'name',
            bindValue: 'value'
        },
        {
            type: FormFieldType.DropDown,
            label: 'Number',
            name: 'No',
            // required: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'Description',
            name: 'Description',
            isDescription: true,
            maxlength: 100
            // readonly: true,
            // required: true
        },

        {
            type: FormFieldType.DropDown,
            label: 'UnitOfMeasure',
            name: 'Unit Of Measure',
            apiUrl: '/unitOfMeasures',
            bindValue: 'Code',
            displayFormat: '[Code] - [Description]',
            // required: true,
            // readonly: true,
        },
        {
            type: FormFieldType.DropDown,
            label: 'LocationCode',
            name: 'Location',
            apiUrl: '/locations',
            bindValue: 'Code',
            displayFormat: '[Code] - [Name]',
            // required: true,
            readonly: true,
        },
        {
            type: FormFieldType.Number,
            label: 'Quantity',
            name: 'Quantity',
            decimal: true,
            autoSave: false,
            // required: true,
            // readonly: true,
        },
        {
            type: FormFieldType.Number,
            label: 'UnitPrice',
            name: 'Unit Cost',
            decimal: true,
            autoSave: false,
            // required: true
        },
        {
            type: FormFieldType.Number,
            label: 'Amount',
            name: 'Amount',
            decimal: true,
            // required: true,
            readonly: true,
            autoSave: false,
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
        },
    ],
    removeUnicodeCharFields: ['PurchaseRequisitionType']
}
