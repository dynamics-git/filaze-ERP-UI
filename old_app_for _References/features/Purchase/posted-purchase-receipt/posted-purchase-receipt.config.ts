import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const PostedPurchaseReceiptHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/postedPurchRcptHeaders',
    title: 'Posted Purchase Receipt',
   sections: [
  {
    title: 'Basic Details',
    controls: [
      [
        { type: FormFieldType.TextBox, label: 'No', name: 'No', required: true },
        { type: FormFieldType.DateTime, label: 'PromisedReceiptDate', name: 'Promised Receipt Date', dateOnly: true, defaultSystemDate: true }
      ],
      [
        { type: FormFieldType.TextBox, label: 'BuyFromVendorNo', name: 'Vendor No', readonly: true },
        { type: FormFieldType.DateTime, label: 'OrderDate', name: 'Order Date', dateOnly: true, defaultSystemDate: true }
      ],
      [
        { type: FormFieldType.TextBox, label: 'BuyFromVendorName', name: 'Vendor Name', readonly: true },
        { type: FormFieldType.DateTime, label: 'RequestedReceiptDate', name: 'Requested Receipt Date', dateOnly: true, defaultSystemDate: true }
      ]
    ]
  },
  {
    title: 'Vendor & Location Info',
    controls: [
      [
        { type: FormFieldType.TextBox, label: 'BuyFromAddress', name: 'Address', readonly: true },
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
        { type: FormFieldType.TextBox, label: 'BuyFromCountryRegionCode', name: 'Country', readonly: true }
      ],
      [
        { type: FormFieldType.TextBox, label: 'BuyFromPostCode', name: 'Post Code', readonly: true },
        { type: FormFieldType.DateTime, label: 'DocumentDate', name: 'Document Date', dateOnly: true, defaultSystemDate: true }
      ],
      [
        { type: FormFieldType.TextBox, label: 'BuyFromCity', name: 'City', readonly: true },
        { type: FormFieldType.PhoneNumber, label: 'QuoteNo', name: 'Quote No' }
      ],
      [
        { type: FormFieldType.PhoneNumber, label: 'BuyFromContactNo', name: 'Contact No', readonly: true },
        { type: FormFieldType.TextBox, label: 'OrderNo', name: 'Order No' }
      ]
    ]
  },
  {
    title: 'Vendor References',
    controls: [
      [
        { type: FormFieldType.TextBox, label: 'VendorInvoiceNo', name: 'Vendor Invoice No' },
        { type: FormFieldType.TextBox, label: 'VendorOrderNo', name: 'Vendor Order No' }
      ],
      [
        { type: FormFieldType.TextBox, label: 'VendorShipmentNo', name: 'Vendor Shipment No' }
      ]
    ]
  },
  {
    title: 'Project & Department',
    controls: [
      [
        { type: FormFieldType.TextBox, label: 'ShortcutDimension1Code', name: 'PROJECT' },
        { type: FormFieldType.TextBox, label: 'ShortcutDimension2Code', name: 'DEPARTMENT/COST CNTR' }
      ]
    ]
  },
  {
    title: 'Payment & Status',
    controls: [
      [
        { type: FormFieldType.TextBox, label: 'VendorStatus', name: 'Vendor Status' },
        { type: FormFieldType.TextBox, label: 'PaymentTermsCode', name: 'Payment TermsCode' }
      ]
    ]
  },
  {
    title: 'Dates & References',
    controls: [
      [
        { type: FormFieldType.DateTime, label: 'ValidityDate', name: 'Validity Date', dateOnly: true },
        { type: FormFieldType.DateTime, label: 'DeliveryDate', name: 'Delivery Date', dateOnly: true }
      ],
      [
        { type: FormFieldType.TextBox, label: 'YourReference', name: 'Your Reference' },
        { type: FormFieldType.TextBox, label: 'PaymentReference', name: 'Payment Reference' }
      ]
    ]
  },
  {
    title: 'Remarks',
    controls: [
      [
        { type: FormFieldType.TextArea, label: 'Remark', name: 'Remark', isDescription: true, maxlength: 100 }
      ]
    ]
  }
],
};
PostedPurchaseReceiptHeader.controls = (PostedPurchaseReceiptHeader.sections ?? []).flatMap(section => section.controls);


export const PostedPurchaseReceiptLine: LineDataConfig = {
    idProp: 'Id',
    headerPKProp: 'No',
    lineFKProp: 'DocumentNo',
    api: '/postedPurchRcptLines',
    showCreate: false,
    showDelete: false,
    disableLine: true,
    controls: [
        {
            type: FormFieldType.DropDown,
            label: 'Type',
            name: 'Type',
            items: [{
                value: 'G/L Account',
                name: 'G/L Account'
            },{
                value: 'Item',
                name: 'Item'
            },{
                value: 'Fixed Asset',
                name: 'Fixed Asset'
            },{
                value: 'Charge (Item)',
                name: 'Charge (Item)'
            },{
                value: ' ',
                name: 'Comment'
            }],
            bindLabel: 'name',
            bindValue: 'value',
        },
        {
            type: FormFieldType.DropDown,
            label: 'No',
            name: 'No',
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
            type: FormFieldType.TextBox,
            label: 'ShortcutDimension1Code',
            name: 'PROJECT'
        },
        {
            type: FormFieldType.TextBox,
            label: 'ShortcutDimension2Code',
            name: 'DEPARTMENT/COST CNTR'
        },
        // {
        //     type: FormFieldType.TextBox,
        //     label: 'ShortcutDimCode3',
        //     name: 'Shortcut Dimension 3'
        // },
        // {
        //     type: FormFieldType.TextBox,
        //     label: 'ShortcutDimCode4',
        //     name: 'Shortcut Dimension 4'
        // },
        // {
        //     type: FormFieldType.TextBox,
        //     label: 'ShortcutDimCode5',
        //     name: 'Shortcut Dimension 5'
        // },
        // {
        //     type: FormFieldType.TextBox,
        //     label: 'ShortcutDimCode6',
        //     name: 'Shortcut Dimension 6'
        // },
        // {
        //     type: FormFieldType.TextBox,
        //     label: 'ShortcutDimCode7',
        //     name: 'Shortcut Dimension 7'
        // },
        // {
        //     type: FormFieldType.TextBox,
        //     label: 'ShortcutDimCode8',
        //     name: 'Shortcut Dimension 8'
        // }
    ],
    removeUnicodeCharFields: ['Type']
}
export const PurchaseReceiptCalculation: CalculationSectionConfig = {
    controls: [
        [
            {
                type: FormFieldType.Number,
                label: 'totalQuantity',
                name: 'Total Quantity',
                readonly: true,
                initialValue: '0',
                decimal: true,
                alignRight: true
            }
        ]
    ]
}