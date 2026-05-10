import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const PrePaymentPostedPurchaseInvoiceHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/postedPurchInvHeaders',
    title: 'Posted Purchase Invoice',
    buttons: [
        {
            label: 'demo',
            name: '',
            icon: ''
        },
    ],
    // controls: [
    //     [
    //         {
    //             type: FormFieldType.TextBox,
    //             label: 'No',
    //             name: 'No',
    //             required: true
    //         },
    //         {
    //             type: FormFieldType.DateTime,
    //             label: 'PromisedReceiptDate',
    //             name: 'Promised Receipt Date'
    //         }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.TextBox,
    //             label: 'BuyFromVendorNo',
    //             name: 'Vendor No',
    //             readonly: true
    //         },
    //         {
    //             type: FormFieldType.DateTime,
    //             label: 'OrderDate',
    //             name: 'Order Date'
    //         }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.TextBox,
    //             label: 'BuyFromVendorName',
    //             name: 'Vendor Name',
    //             readonly: true
    //         },
    //         {
    //             type: FormFieldType.DateTime,
    //             label: 'RequestedReceiptDate',
    //             name: 'Requested Receipt Date'
    //         }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.TextBox,
    //             label: 'BuyFromAddress',
    //             name: 'Address',
    //             readonly: true
    //         },
    //         {
    //             type: FormFieldType.DropDown,
    //             label: 'PurchaserCode',
    //             name: 'Purchaser Code',
    //             apiUrl: '/salespersonPurchasers',
    //             bindValue: 'Code',
    //             displayFormat: '[Code]-[Name]'
    //         }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.TextBox,
    //             label: 'BuyFromCountry',
    //             name: 'Country',
    //             readonly: true
    //         },
    //         {
    //             type: FormFieldType.DropDown,
    //             label: 'Status',
    //             name: 'Status',
    //             items: [{
    //                 value: 'Open',
    //                 name: 'Open'
    //             }, {
    //                 value: 'Released',
    //                 name: 'Released'
    //             }, {
    //                 value: 'Rejected',
    //                 name: 'Rejected'
    //             }],
    //             bindLabel: 'name',
    //             bindValue: 'value',
    //         }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.TextBox,
    //             label: 'BuyFromPostCode',
    //             name: 'Post Code',
    //             readonly: true
    //         },
    //         {
    //             type: FormFieldType.DateTime,
    //             label: 'DocumentDate',
    //             name: 'Document Date'
    //         }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.TextBox,
    //             label: 'BuyFromCity',
    //             name: 'City',
    //             readonly: true
    //         },
    //         {
    //             type: FormFieldType.PhoneNumber,
    //             label: "QuoteNo",
    //             name: "Quote No",
    //         }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.PhoneNumber,
    //             label: "BuyFromContactNumber",
    //             name: "Contact No",
    //             readonly: true
    //         },
    //         {
    //             type: FormFieldType.TextBox,
    //             label: "OrderNo",
    //             name: "Order No"
    //         }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.TextBox,
    //             label: "VendorInvoiceNo",
    //             name: "Vendor Invoice No"
    //         },
    //         {
    //             type: FormFieldType.TextBox,
    //             label: "VendorOrderNo",
    //             name: "Vendor Order No"
    //         }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.TextBox,
    //             label: "VendorShipmentNo",
    //             name: "Vendor Shipment No"
    //         }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.TextBox,
    //             label: 'ShortcutDimension1Code',
    //             name: 'PROJECT'
    //         },
    //         {
    //             type: FormFieldType.TextBox,
    //             label: 'ShortcutDimension2Code',
    //             name: 'DEPARTMENT/COST CNTR'
    //         },
    //     ],
    //     [
    //         {
    //             type: FormFieldType.TextBox,
    //             label: "VendorStatus",
    //             name: "Vendor Status",
    //         },
    //         {
    //             type: FormFieldType.TextBox,
    //             label: "PaymentTermsCode",
    //             name: "Payment TermsCode",
    //         }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.DateTime,
    //             label: "ValidityDate",
    //             name: "Validity Date",
    //             dateOnly: true,
    //             // defaultSystemDate: true            
    //         },
    //             {
    //                 type: FormFieldType.DateTime,
    //                 label: "DeliveryDate",
    //                 name: "Delivery Date",
    //                 dateOnly: true,
    //                 // defaultSystemDate: true            
    //             }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.TextBox,
    //             label: "YourReference",
    //             name: "Your Reference",
    //         },
    //         {
    //             type: FormFieldType.TextBox,
    //             label: "PaymentReference",
    //             name: "Payment Reference",
    //         }
    //     ],
    //     [
    //         {
    //             type: FormFieldType.TextArea,
    //             label: 'Remark',
    //             name: 'Remark',
    //             isDescription: true,
    //             maxlength: 100
    //         }
    //     ]
    // ]

    sections: [
        {
            title: 'Order Summary',
            controls: [
                [
                    { type: FormFieldType.TextBox, label: 'No', name: 'No', required: true },
                    { type: FormFieldType.DateTime, label: 'PromisedReceiptDate', name: 'Promised Receipt Date' }
                ],
                [
                    { type: FormFieldType.DateTime, label: 'OrderDate', name: 'Order Date' },
                    { type: FormFieldType.DateTime, label: 'RequestedReceiptDate', name: 'Requested Receipt Date' }
                ],
                [
                    { type: FormFieldType.DateTime, label: 'DocumentDate', name: 'Document Date' },
                    { type: FormFieldType.DateTime, label: 'ValidityDate', name: 'Validity Date', dateOnly: true }
                ],
                [
                    { type: FormFieldType.DateTime, label: 'DeliveryDate', name: 'Delivery Date', dateOnly: true }
                ]
            ]
        },
        {
            title: 'Vendor Information',
            controls: [
                [
                    { type: FormFieldType.TextBox, label: 'BuyFromVendorNo', name: 'Vendor No', readonly: true },
                    { type: FormFieldType.TextBox, label: 'BuyFromVendorName', name: 'Vendor Name', readonly: true }
                ],
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
                    { type: FormFieldType.TextBox, label: 'BuyFromCountry', name: 'Country', readonly: true },
                    {
                        type: FormFieldType.DropDown,
                        label: 'Status',
                        name: 'Status',
                        items: [
                            { value: 'Open', name: 'Open' },
                            { value: 'Released', name: 'Released' },
                            { value: 'Rejected', name: 'Rejected' }
                        ],
                        bindLabel: 'name',
                        bindValue: 'value'
                    }
                ],
                [
                    { type: FormFieldType.TextBox, label: 'BuyFromPostCode', name: 'Post Code', readonly: true },
                    { type: FormFieldType.TextBox, label: 'BuyFromCity', name: 'City', readonly: true }
                ],
                [
                    { type: FormFieldType.PhoneNumber, label: 'BuyFromContactNumber', name: 'Contact No', readonly: true }
                ]
            ]
        },
        {
            title: 'Document References',
            controls: [
                [
                    { type: FormFieldType.TextBox, label: 'OrderNo', name: 'Order No' },
                    { type: FormFieldType.PhoneNumber, label: 'QuoteNo', name: 'Quote No' }
                ],
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
            title: 'Classification & Payment',
            controls: [
                [
                    { type: FormFieldType.TextBox, label: 'ShortcutDimension1Code', name: 'PROJECT' },
                    { type: FormFieldType.TextBox, label: 'ShortcutDimension2Code', name: 'DEPARTMENT/COST CNTR' }
                ],
                [
                    { type: FormFieldType.TextBox, label: 'VendorStatus', name: 'Vendor Status' },
                    { type: FormFieldType.TextBox, label: 'PaymentTermsCode', name: 'Payment TermsCode' }
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
                    {
                        type: FormFieldType.TextArea,
                        label: 'Remark',
                        name: 'Remark',
                        isDescription: true,
                        maxlength: 100
                    }
                ]
            ]
        }
    ]

};

PrePaymentPostedPurchaseInvoiceHeader.controls = (PrePaymentPostedPurchaseInvoiceHeader.sections ?? []).flatMap(section => section.controls);


export const PrePaymentPostedPurchaseInvoiceLine: LineDataConfig = {
    idProp: 'Id',
    headerPKProp: 'No',
    lineFKProp: 'DocumentNo',
    api: '/postedPurchInvLines',
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
            }, {
                value: 'Item',
                name: 'Item'
            }, {
                value: 'Fixed Asset',
                name: 'Fixed Asset'
            }, {
                value: 'Charge (Item)',
                name: 'Charge (Item)'
            }, {
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
            type: FormFieldType.Number,
            label: 'UnitPrice',
            name: 'Unit Cost',
            decimal: true
        },
        {
            type: FormFieldType.Number,
            label: 'Amount',
            name: 'Amount',
            decimal: true,
            readonly: true
        },
        {
            type: FormFieldType.Number,
            label: 'QuantityInvoiced',
            name: 'Quantity Invoiced',
            decimal: true
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

export const PrePaymentPostedPurchaseInvoiceLineCalculation: CalculationSectionConfig = {
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