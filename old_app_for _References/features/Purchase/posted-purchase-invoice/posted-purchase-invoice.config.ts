import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const PostedPurchaseInvoiceHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/postedPurchInvHeaders',
    title: 'Posted Purchase Invoice',
    buttons: [
        {
            label: 'Invoice',
            name: 'Print Invoice',
            icon: 'bi bi-save'
        }
    ],
    sections: [
        {
            title: 'General Information',
            controls: [
                [
                    { type: FormFieldType.TextBox, label: 'No', name: 'Number', required: true, readonly: true },
                    { type: FormFieldType.DateTime, label: 'DocumentDate', name: 'Document Date', dateOnly: true, defaultSystemDate: true }
                ], [
                    {
                        type: FormFieldType.DropDown,
                        label: 'BuyFromVendorNo',
                        name: 'Vendor No',
                        apiUrl: '/vendorsAPI',
                        bindValue: 'number',
                        displayFormat: '[number] - [displayName]'
                    },
                    {
                        type: FormFieldType.TextBox, label: 'BuyFromVendorName', name: 'Vendor Name', readonly: true
                    }
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
                    { type: FormFieldType.TextBox, label: 'BuyFromCounty', name: 'Country', readonly: true },
                    // { type: FormFieldType.TextBox, label: 'Status', name: 'Status', initialValue: 'Open', readonly: true, copyResetValue: 'Open' }
                ],
                [
                    { type: FormFieldType.TextBox, label: 'BuyFromPostCode', name: 'Post Code', readonly: true },
                    { type: FormFieldType.TextBox, label: 'BuyFromCity', name: 'City', readonly: true }
                ],
                [
                    { type: FormFieldType.PhoneNumber, label: 'BuyFromContactNumber', name: 'Contact No', readonly: true },
                    { type: FormFieldType.TextBox, label: 'OrderNumber', name: 'Order No' }
                ],
                [
                    { type: FormFieldType.TextBox, label: 'YourReference', name: 'Your Reference' },
                    {
                        type: FormFieldType.DropDown,
                        label: 'BudgetName',
                        name: 'Budget Name',
                        apiUrl: '/glbudgetlists',
                        displayFormat: '[BudgetName] - [description]',
                        bindValue: 'BudgetName'
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
                        label: 'PostingDate',
                        name: 'PostingDate',
                        dateOnly: true,
                        defaultSystemDate: true
                    }
                ], [
                    { type: FormFieldType.TextBox, label: 'VendorInvoiceNo', name: 'Vendor Invoice No' },
                    { type: FormFieldType.TextBox, label: 'VendorOrderNo', name: 'Vendor Order No' }
                ],
                [
                    { type: FormFieldType.TextBox, label: 'VendorShipmentNumber', name: 'Vendor Shipment No' },
                    {
                        type: FormFieldType.DropDown,
                        label: 'PaymentTermsCode',
                        name: 'Payment Terms Code',
                        apiUrl: '/paymentTerms',
                        bindValue: 'Code',
                        displayFormat: '[Code]-[Description]'
                    }
                ],
                //  [{
                //     type: FormFieldType.Number,
                //     label: 'prepaymentAmount',
                //     name: 'Prepayment Amount',
                //     decimal: true,
                //     disabled: true
                // },]
            ]
        }, {
            title: 'Invoice',
            controls: [
                [{
                    type: FormFieldType.DropDown,
                    label: 'CurrencyCode',
                    name: 'Currency Code',
                    apiUrl: '/currencyCodes',
                    bindValue: 'Code',
                    displayFormat: '[Code]',
                }, {
                    type: FormFieldType.DropDown,
                    label: 'PaymentTermsCode',
                    name: 'Payment Terms Code',
                    apiUrl: '/paymentTerms',
                    bindValue: 'Code',
                    displayFormat: '[Code]-[Description]'
                },],
                [{
                    type: FormFieldType.DateTime,
                    label: 'expectedReceiptDate',
                    name: 'Expected Receipt Date',
                    defaultSystemDate: true
                }, {
                    type: FormFieldType.TextBox,
                    label: 'ShortcutDimension1Code',
                    name: 'Department Code',
                },],
                [{
                    type: FormFieldType.Checkbox,
                    label: 'pricesIncludingVAT',
                    name: 'Prices Including VAT',
                }, {
                    type: FormFieldType.TextBox,
                    label: 'ShortcutDimension2Code',
                    name: 'Customer Group Code',
                },],
                [{
                    type: FormFieldType.DropDown,
                    label: 'vatBusPostingGroup',
                    name: 'Vat Bus Posting Group',
                    apiUrl: '/vatBusinessPostingGroups',
                    bindValue: 'Code',
                    displayFormat: '[Code]-[Description]'
                },
                {
                    type: FormFieldType.Number,
                    label: 'paymentDiscount',
                    name: 'Payment Discount %',
                },],
            ]
        },
        //TMY/Subhankar/26.03.26/ Confirm by Biplab
        // {
        //     title: 'E-invoice',
        //     controls: [
        //         [
        //             {
        //                 type: FormFieldType.Checkbox,
        //                 label: 'eMySendToEInvoice',
        //                 name: 'Send-to E-Invoice',
        //                 readonly: true,
        //             },
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyFreeTradeAgreement',
        //                 name: 'Free Trade Agreement',
        //                 readonly: true,
        //             }
        //         ],
        //         [
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyEInvoiceVersion',
        //                 name: 'e-Invoice Version',
        //                 readonly: true,
        //             },
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyATIGANo',
        //                 name: 'Authorisation No. for Certified Exporter',
        //                 readonly: true,
        //             }
        //         ],
        //         [
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyEInvoiceType',
        //                 name: 'e-Invoice Type',
        //                 readonly: true,
        //             },
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyGoodsExportDeclNo',
        //                 name: 'Goods Export Declaration No.',
        //                 readonly: true,
        //             }
        //         ],
        //         [
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyEInvoiceTypeCode',
        //                 name: 'e-Invoice Type Code',
        //                 readonly: true,
        //             },
        //             {
        //                 type: FormFieldType.Checkbox,
        //                 label: 'isConsolidated',
        //                 name: 'Is Consolidated e-Invoice',
        //                 readonly: true,
        //             }
        //         ],
        //         [
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMYEInvoiceBuyerType',
        //                 name: 'e-Invoice Buyer Type',
        //                 readonly: true,
        //             },
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'consolidatedInvNo',
        //                 name: 'Consolidated e-Invoice No.',
        //                 readonly: true,
        //             }
        //         ],
        //         [
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMYTIN',
        //                 name: 'TIN',
        //                 readonly: true,
        //             },
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyUniqueIdentifierNumber',
        //                 name: 'eMy Unique Identifier No.',
        //                 readonly: true,
        //             }
        //         ],
        //         [
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMYBillToTIN',
        //                 name: 'Bill-to TIN',
        //                 readonly: true,
        //             },
        //             {
        //                 type: FormFieldType.DateTime,
        //                 label: 'eMyDateTimeOfValidation',
        //                 name: 'Validated DateTime',
        //                 readonly: true,
        //                 defaultSystemDate: false
        //             }
        //         ],
        //         [
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyBuyerIdentificationNo',
        //                 name: 'Buyers Identification no.',
        //                 readonly: true,
        //             },
        //             {
        //                 type: FormFieldType.DateTime,
        //                 label: 'eMyReceivedDateTime',
        //                 name: 'eMy Received DateTime',
        //                 readonly: true,
        //                 defaultSystemDate: false
        //             }
        //         ],
        //         [
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyShippingIdentificationNo',
        //                 name: 'Shipping Identification No.',
        //                 readonly: true,
        //             },
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyStatusOfRespond',
        //                 name: 'eMy Status of Respond',
        //                 readonly: true,
        //             }
        //         ],
        //         [
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMYNonMYIndividualType',
        //                 name: 'Non-MY Individual Type',
        //                 readonly: true,
        //             },
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyValidationLink',
        //                 name: 'eMy Validation Link',
        //                 readonly: true,
        //             }
        //         ],
        //         [
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyShippingNonMYIndividualNo',
        //                 name: 'Shipping Non-MY Individual No.',
        //                 readonly: true,
        //             },
        //             {
        //                 type: FormFieldType.TextBox,
        //                 label: 'eMyReason',
        //                 name: 'eMy Reason',
        //                 readonly: true,
        //             }
        //         ],
        //         [
        //             {
        //                 type: FormFieldType.Checkbox,
        //                 label: 'eMyExport',
        //                 name: 'Export',
        //                 readonly: true,
        //             },
        //             {
        //                 type: FormFieldType.DateTime,
        //                 label: 'emyCancelDateTime',
        //                 name: 'Cancel / Reject DateTime',
        //                 readonly: true,
        //                 defaultSystemDate: false,
        //             }
        //         ]
        //     ]
        // }
    ]
};

PostedPurchaseInvoiceHeader.controls = (PostedPurchaseInvoiceHeader.sections ?? []).flatMap(section => section.controls);

export const PostedPurchaseInvoiceLine: LineDataConfig = {
    idProp: 'Id',
    headerPKProp: 'No',
    lineFKProp: 'DocumentNo',
    api: '/postedPurchInvLines',
    showCreate: false,
    showDelete: false,
    disableLine: true,
    showLineAttachments: true,
    isShowUploaderFile: true,
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
export const PostedPurchaseInvoiceLineCalculation: CalculationSectionConfig = {
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